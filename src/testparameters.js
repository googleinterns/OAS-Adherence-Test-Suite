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
const lodash = require('lodash');
const os = require('os');
const {BaseConfig, prompt} = require('./cli/prompts');
const {upsertConfig} = require('./utils/config');
const {getApiEndpoints, verifyApiEndpoints, parseOASDoc} =
  require('./utils/oas');
const {isValidJSONFile, getJSONData} = require('./utils/app');
const {buildTestSuite} = require('./generators/test_data');
const {getApiKeyList, isBasicAuthRequired} = require('./utils/auth');

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
 * All the arguments of this function are the values provided as command
 * options by the user.
 * @param {object} testSuite testsuite object
 * @param {string} baseURL baseURL of the api endpoints
 * @param {array<{httpMethod: string, path: string}>} apiEndpoints
 * @param {array<{name: string, value: string}>} apiKeys
 * @param {object} basicAuth
 * @param {number} timeout Maximum request-duration
 * @param {object} [overrides = {}] Keys and their overridden values.
 * @param {object} config config object
 */
async function loadTestParameters(testSuite, baseURL, apiEndpoints,
    apiKeys = [], basicAuth, timeout, overrides = {}, config = {}) {
  /*
    newConfigs contains configs/credentials that are prompted and received from
    the user as they are necessary for the execution of testsuite.
    At the end, we provide user, the option to update/create the config file
    with newConfigs.
  */
  const newConfigs = {};
  const testParams = {};

  if (config.testSuitePath && isValidJSONFile(config.testSuitePath)) {
    testParams.testSuite = getJSONData(config.testSuitePath);
    logger.verbose('TestSuite uploaded successfully from config.'.magenta);
  }
  testParams.testSuite = testSuite || testParams.testSuite;

  if (!testParams.testSuite) {
    const choices = [FileType.OAS_DOC, FileType.TESTSUITE_FILE];
    const response = await prompt([BaseConfig.fileType], [{choices}]);
    switch (response.fileType) {
      case FileType.OAS_DOC: {
        const response = await prompt([BaseConfig.oasPath]);
        let oasDoc = getJSONData(response.oasPath);
        oasDoc = await parseOASDoc(oasDoc);
        if (!oasDoc) {
          const errorObject = {
            'Error Type': 'OAS Doc Parse Fail',
            'Error Message': 'Invalid OAS 3.0 Document',
          };
          throw errorObject;
        }
        testParams.testSuite = buildTestSuite(oasDoc, apiEndpoints, overrides);
        const defualtTestSuitePath = os.homedir() +
            snakeCase(`/testsuite ${new Date().toDateString()}`);
        /*
          Since both cli/actions.js and testparamters.js includes each other
          through require(), they eventually fall in an infinite loop.
          To avoid running into an infinte loop, we require the module only when
          required.
        */
        const {generateTestSuite} = require('./cli/actions');
        await generateTestSuite({
          oaspath: response.oasPath,
          testsuitepath: defualtTestSuitePath,
        });
        newConfigs.testSuitePath = defualtTestSuitePath;
        break;
      }
      case FileType.TESTSUITE_FILE: {
        const response = await prompt([BaseConfig.testSuitePath]);
        testParams.testSuite = getJSONData(response.testSuitePath);
        logger.verbose('TestSuite uploaded successfully.'.magenta);
        newConfigs.testSuitePath = response.testSuitePath;
        break;
      }
    }
  }

  const oasDoc = testParams.testSuite.oasDoc;
  displayTestSuiteDetails(testParams.testSuite);

  /*
    If the user has not provided the baseURL through command option or
    config file, fetch the baseURL from the oas doc.
    If multiple baseURLs are present in the oas doc, pick the first one.
  */
  testParams.baseURL = baseURL || config.baseURL || oasDoc.servers[0].url;

  testParams.apiEndpointsToTest = apiEndpoints || config.apiEndpoints;
  if (!testParams.apiEndpointsToTest) {
    const allApiEndpoints = getApiEndpoints(oasDoc);
    verifyApiEndpoints(allApiEndpoints);
    const allApiEndpointsString = allApiEndpoints.map(function(apiEndpoint) {
      return JSON.stringify(apiEndpoint);
    });
    const response = await prompt([BaseConfig.apiEndpoints],
        [{choices: allApiEndpointsString}]);
    const apiEndpointsString = response.apiEndpoints;
    testParams.apiEndpointsToTest =
      apiEndpointsString.map(function(apiEndpoint) {
        return JSON.parse(apiEndpoint);
      });
    newConfigs.apiEndpoints = testParams.apiEndpointsToTest;
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
    if (!apiKeysObject[apiKey.name]) {
      apiKeysObject[apiKey.name] = apiKey.value;
    }
  });
  const requiredApiKeys = getApiKeyList(testParams.apiEndpointsToTest, oasDoc);
  for (const requiredApiKeyName of requiredApiKeys) {
    if (apiKeysObject[requiredApiKeyName]) continue;
    const response = await prompt([BaseConfig.apiKey],
        [{message: `[API Key] ${requiredApiKeyName}`}]);
    apiKeysObject[requiredApiKeyName] = response.apiKeyValue;
    newConfigs.apiKeys = newConfigs.apiKeys || [];
    newConfigs.apiKeys.push({
      name: requiredApiKeyName,
      value: response.apiKeyValue,
    });
  }
  testParams.apiKeys = apiKeysObject;

  if (isBasicAuthRequired(testParams.apiEndpointsToTest, oasDoc)) {
    testParams.basicAuth = basicAuth || config.basicAuth;
    if (!testParams.basicAuth) {
      const response = await prompt([BaseConfig.username]);
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
      testParams.basicAuth = basicAuth;
      newConfigs.basicAuth = basicAuth;
    }
  }

  testParams.timeout = timeout || config.timeout;

  if (!lodash.isEmpty(newConfigs)) {
    await addConfigs(newConfigs, config);
  }

  module.exports.testParams = testParams;
  logger.verbose('Exported test params successfully.'.magenta);
}

/**
 * Adds newConfig attributes by updating/creating the config file.
 * @param {object} newConfigs newConfigs contains configs/credentials that are
 *    prompted and received from the user.
 * @param {object} config
 */
async function addConfigs(newConfigs, config) {
  const response = await prompt([BaseConfig.upsertConfig]);
  if (response.upsertConfig) {
    const keys = Object.keys(newConfigs);
    keys.forEach(function(key) {
      if (key === 'apiKeys') {
        /*
          In order to persist the exisiting API keys present in config file ,
          we concat the new API keys to it.
        */
        config[key] = config[key] || [];
        config[key] = config[key].concat(newConfigs[key]);
        return;
      }
      config[key] = newConfigs[key];
    });

    const defualtConfigFilePath = os.homedir() +
      snakeCase(`/config ${new Date().toDateString()}`);
    const response = await prompt([BaseConfig.configFilePath],
        [{default: defualtConfigFilePath}]);
    upsertConfig(config, response.configFilePath);
  }
}

/**
 * Displays basic info of a TestSuite.
 * @param {object} testSuite TestSuite Document.
 */
function displayTestSuiteDetails(testSuite) {
  const oasDoc = testSuite.oasDoc;
  const title = oasDoc.info.title;
  const version = oasDoc.openapi;
  logger.info('\nTestSuite Details:');
  logger.info('Created At: '.grey.bold +
    `${testSuite.createdAtTimeStamp}`.cyan);
  logger.info('Title: '.grey.bold + `${title}`.cyan);
  logger.info(`Version: `.grey.bold + `${version}\n`.cyan);
}

module.exports = {
  loadTestParameters,
};
