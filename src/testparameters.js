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
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const {
  FileType,
  fileTypePrompt,
  oasPathPrompt,
  testSuitePathPrompt,
  apiEndpointPrompt,
  usernamePrompt,
  passwordPrompt,
  apiKeyPrompt,
  upsertConfigPrompt,
  configDetailsPrompt,
} = require('./cli/prompts');
const {upsertConfig} = require('./utils/config');
const {getApiEndpoints} =require('./utils/oas');
const {buildTestSuite} = require('./generators/test_data');
const {getApiKeyList, isBasicAuthRequired} = require('./auth');
const {parseOASDoc} = require('./utils/oas');

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
      try {
        testSuite = fs.readFileSync(config.testSuitePath, 'utf8');
        testSuite = JSON.parse(testSuite);
        oasDoc = testSuite.oasDoc;
        logger.verbose('testSuite uploaded successfully.'.magenta);
      } catch (err) {
        logger.error('testSuite upload failed.'.red +
          '(check path of testsuite in the config file)'.red);
        return;
      }
    } else {
      const response = await fileTypePrompt();
      switch (response.fileType) {
        case FileType.OAS_DOC: {
          const response = await oasPathPrompt();
          oasDoc = fs.readFileSync(response.oasPath, 'utf8');
          oasDoc = JSON.parse(oasDoc);
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
          const response = await testSuitePathPrompt();
          try {
            testSuite = fs.readFileSync(response.testSuitePath, 'utf8');
            testSuite = JSON.parse(testSuite);
            oasDoc = testSuite.oasDoc;
            extraConfig.testSuitePath = response.testSuitePath;
          } catch (err) {
            const errorObject = {
              'Error Type': 'testsuite parse fail',
              'Error Message': 'invalid testsuite document',
            };
            throw errorObject;
          }
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
      const response = await apiEndpointPrompt(allApiEndpointsString);
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
    const response = await apiKeyPrompt(requiredApiKeyName);
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
      let response;
      response = await usernamePrompt();
      basicAuth = {};
      basicAuth.username = response.userName;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        response = await passwordPrompt();
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
    const response = await upsertConfigPrompt();
    if (response.upsertConfig) {
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
      const response = await configDetailsPrompt();
      const configDirectoryPath = response.configDirectoryPath;
      const configFileName = snakeCase(`${response.configFileName}.json`);
      const configPath = path.join(configDirectoryPath, configFileName);
      upsertConfig(config, configPath);
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
