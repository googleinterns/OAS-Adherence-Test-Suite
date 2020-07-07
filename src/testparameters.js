/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @module testparameters */
/**
 * @fileoverview Contains functions that helps in loading the necessary test
 * parameters like testSuite, auth credentials (API Key, Basic auth credentails)
 * , apiEndpoints to be tested which are essential for the execution of test.
 */

const {logger} = require('./log');
const {snakeCase} = require('./utils/app');
const _ = require('lodash');
const {BaseConfig, prompt} = require('./cli/prompts');
const {upsertConfig} = require('./utils/config');
const {getApiEndpoints, parseOASDoc} =require('./utils/oas');
const {isValidJSONFile, getJSONData} = require('./utils/app');
const {buildTestSuite} = require('./generators/test_data');
const {getApiKeyList, isBasicAuthRequired} = require('./auth');

/* Supported Input File Types*/
const FileType = {
  OAS_DOC: 'oas document file',
  TESTSUITE_FILE: 'testsuite file',
};

/**
 * Loads test parameters which are essential for the execution of test cases.
 * Test parameters include testSuite, baseURL, auth credentials(API Key,
 * basic auth credentails), apiEndpoints to be tested and few more.
 * A test parameter can be loaded from:
 *   - command options
 *   - config file
 * When a particular test parameter is present in both command option and
 * config file. The value passed through the command option is loaded.
 * When a necessary test paramter is missing, we prompt the user to provide it.
 * @param {object} testSuite testsuite object
 * @param {string} baseURL baseURL of the api endpoints
 * @param {Array< {httpMethod: String, path: String} >} apiEndpoints
 * @param {array<{name:string, value: string}>} apiKeys
 * @param {object} basicAuth
 * @param {number} timeout maximum request-duration
 * @param {object} config config object
 */
async function loadTestParameters(testSuite, baseURL, apiEndpoints,
    apiKeys = [], basicAuth, timeout, config = {}) {
  /*
    extraConfig contains extra configs/credentials that are prompted and
    received from the user as they are necessary for the execution of testsuite.
    At the end, we provide user, the option to update/create the config file
    with extraConfig.
  */
  const extraConfig = {};
  let oasDoc;
  if (testSuite == null) {
    if (config.testSuitePath) {
      if (isValidJSONFile(config.testSuitePath)) {
        testSuite = getJSONData(config.testSuitePath);
        logger.verbose('testSuite uploaded successfully.'.magenta);
        oasDoc = testSuite.oasDoc;
      } else {
        logger.error('testSuite upload failed.'.red +
          '(check path of testsuite in the config file)'.red);
        return;
      }
    } else {
      const choices = [FileType.OAS_DOC, FileType.TESTSUITE_FILE];
      const response = await prompt(BaseConfig.fileType, {choices});
      switch (response.fileType) {
        case FileType.OAS_DOC: {
          const response = await prompt(BaseConfig.oasPath);
          oasDoc = getJSONData(response.oasPath);
          oasDoc = await parseOASDoc(oasDoc);
          if (oasDoc == null) {
            const errorObject = {
              'Error Type': 'oas doc parse fail',
              'Error Message': 'invalid oas 3.0 document',
            };
            throw errorObject;
          }
          testSuite = buildTestSuite(oasDoc);
          break;
        }
        case FileType.TESTSUITE_FILE: {
          const response = await prompt(BaseConfig.testSuitePath);
          testSuite = getJSONData(response.testSuitePath);
          logger.verbose('testSuite uploaded successfully.'.magenta);
          oasDoc = testSuite.oasDoc;
          extraConfig.testSuitePath = response.testSuitePath;
          break;
        }
      }
    }
  } else {
    oasDoc = testSuite.oasDoc;
  }

  const title = oasDoc.info.title;
  const version = oasDoc.openapi;
  logger.info('\nTestSuite Details:');
  logger.info('Created At: '.grey.bold +
    `${testSuite.createdAtTimeStamp}`.cyan);
  logger.info('Title: '.grey.bold + `${title}`.cyan);
  logger.info(`Version: `.grey.bold + `${version}\n`.cyan);

  if (baseURL == null) {
    if (config.baseURL) baseURL = config.baseURL;
    else {
      /*
        If the user has not provided the baseURL through command option or
        config file, fetch the baseURL from the oas doc.
        If multiple baseURLs are present in the oas doc, pick the first one.
      */
      baseURL = oasDoc.servers[0].url;
    }
  }

  if (apiEndpoints == null) {
    if (config.apiEndpoints) apiEndpoints = config.apiEndpoints;
    else {
      const allApiEndpoints = getApiEndpoints(oasDoc);
      const allApiEndpointsString = allApiEndpoints.map(function(apiEndpoint) {
        return JSON.stringify(apiEndpoint);
      });
      const response = await prompt(BaseConfig.apiEndpoints,
          {choices: allApiEndpointsString});
      const apiEndpointsString = response.apiEndpoints;
      apiEndpoints = apiEndpointsString.map(function(apiEndpoint) {
        return JSON.parse(apiEndpoint);
      });
      extraConfig.apiEndpoints = apiEndpoints;
    }
  }

  const apiKeysObject = {};
  apiKeys.forEach(function(apiKey) {
    apiKeysObject[apiKey.name] = apiKey.value;
  });
  config.apiKeys = config.apiKeys || [];
  config.apiKeys.forEach(function(apiKey) {
    /*
      Fetch the value of API key from config file, only if
      it is not provided by the user through command options.
    */
    if (!apiKeysObject[apiKey.name]) apiKeysObject[apiKey.name] = apiKey.value;
  });
  const requiredApiKeys = getApiKeyList(apiEndpoints, oasDoc);
  for (const requiredApiKeyName of requiredApiKeys) {
    const response = await prompt(BaseConfig.apiKey,
        {message: `[API Key] ${requiredApiKeyName}`});
    apiKeysObject[requiredApiKeyName] = response.apiKeyValue;
    extraConfig.apiKeys = extraConfig.apiKeys || [];
    extraConfig.apiKeys.push({
      name: requiredApiKeyName,
      value: response.apiKeyValue,
    });
  }

  if (isBasicAuthRequired(apiEndpoints, oasDoc) && basicAuth == null) {
    if (config.basicAuth) basicAuth = config.basicAuth;
    else {
      const response = await prompt(BaseConfig.username);
      basicAuth = {};
      basicAuth.username = response.username;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const response = await prompt(BaseConfig.password);
        if (response.password !== response.confirmPassword) {
          logger.error('password and confirm password does not match'.red);
        } else {
          basicAuth.password = response.password;
          break;
        }
      }
      extraConfig.basicAuth = basicAuth;
    }
  }

  if (timeout == null && config.timeout) {
    timeout = config.timeout;
  }

  if (!_.isEmpty(extraConfig)) {
    const response = await prompt(BaseConfig.upsertConfig);
    if (response.upsertConfig == true) {
      const keys = Object.keys(extraConfig);
      keys.forEach(function(key) {
        if (key == 'apiKeys') {
          /*
            In order to persist the exisiting API keys present in config file ,
            we concat the new API keys to it.
          */
          config[key] = config[key] || [];
          config[key] = config[key].concat(extraConfig[key]);
          return;
        }
        config[key] = extraConfig[key];
      });

      const defualtConfigFilePath = require('os').homedir() +
        snakeCase(`config ${new Date().toDateString()}`);
      const response = await prompt(BaseConfig.configFilePath,
          {default: defualtConfigFilePath});
      upsertConfig(config, response.configFilePath);
    }
  }

  module.exports.testParams = {
    baseURL,
    apiEndpointsToTest: apiEndpoints,
    testSuite,
    basicAuth,
    apiKeys: apiKeysObject,
    timeout,
  };
  logger.verbose('\nExported test params successfully.');
}

module.exports = {
  loadTestParameters,
};
