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

/** @module cli/actions */
/**
 * @fileoverview contains functions/actions that are triggered by a command.
 */

// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const {logger} = require('../log');
const {loadTestParameters} = require('../testparameters');
const {parseOASDoc} = require('../utils/oas');
const {
  createTestSuiteFile,
  buildTestSuite,
} = require('../generators/test_data');
const {runTestSuite} = require('../testsuite_runner');
const {buildConfig, getConfig, upsertConfig} = require('../utils/config');
const {isValidJSONFile, getJSONData} = require('../utils/app');
const {BaseConfig, prompt} = require('./prompts');

/**
 * generates testsuite and creates a testSuite file in the path specified
 * by the user.
 * @param {object} options options of the command 'generate'
 */
async function generateTestSuite(options) {
  if (options.verbose) {
    /*
      overwrite the level of logger object to 'verbose'.
      Reason: To provide extensive information/logs to the user.
    */
    logger.level = 'verbose';
  }

  let oasDoc;
  let oasPath = options.oaspath;
  if (oasPath == null) {
    const response = await prompt(BaseConfig.oasPath);
    oasPath = response.oasPath;
  }
  try {
    oasDoc = getJSONData(oasPath);
    oasDoc = await parseOASDoc(oasDoc);
    logger.verbose('oas document uploaded and parsed successfully.\n'.magenta);
  } catch (err) {
    logger.error('oas document upload/parse failed.'.red);
    return;
  }

  const title = oasDoc.info.title;
  const version = oasDoc.openapi;
  logger.info('Title: '.grey.bold + `${title}`.cyan);
  logger.info(`Version: `.grey.bold + `${version}`.cyan);

  let testSuitePath = options.testsuitepath;
  if (testSuitePath == null) {
    const response = await prompt(BaseConfig.testSuitePath, {
      validate: function(path) {
        /*
          Since, we provide error logs to users if something goes wrong during
          the creation of testsuite file. Skip validation at the time of
          creating a testsuite file.
        */
        return true;
      },
    });
    testSuitePath = response.testSuitePath;
  }
  createTestSuiteFile(oasDoc, testSuitePath);
}

/**
 * validates api endpoints by loading the test parameters and
 * triggering the testrunner.
 * @param {object} options options of the command 'validate'
 */
async function validateApiEndpoints(options) {
  if (options.verbose) {
    /*
      overwrite the level of logger object to 'verbose'.
      Reason: To provide extensive information/logs to the user.
    */
    logger.level = 'verbose';
  }

  const testSuitePath = options.testsuitepath;
  let testSuite;
  if (testSuitePath) {
    if (isValidJSONFile(testSuitePath)) {
      testSuite = getJSONData(testSuitePath);
      logger.verbose('testsuite uploaded successfully.\n'.magenta);
    } else {
      logger.error('testsuite Upload Failed.'.red);
      return;
    }
  }

  const oasPath = options.oaspath;
  if (oasPath) {
    if (isValidJSONFile(oasPath)) {
      const oasDoc = getJSONData(oasPath);
      logger.verbose('oas 3.0 document uploaded successfully.\n'.magenta);
      testSuite = buildTestSuite(oasDoc);
      logger.verbose('testsuite created successfully.\n'.magenta);
    } else {
      logger.error('oas 3.0 document upload Failed.'.red);
      return;
    }
  }

  let apiEndpoints = options.apiendpoints;
  if (apiEndpoints) {
    try {
      apiEndpoints = JSON.parse(apiEndpoints);
    } catch (err) {
      logger.error('invalid api endpoints'.red);
      return;
    }
  }

  let apiKeys = options.apikeys;
  if (apiKeys) {
    try {
      apiKeys = JSON.parse(apiKeys);
    } catch (err) {
      logger.error('invalid apikeys'.red);
      return;
    }
  }

  let basicAuth = options.basicauth;
  if (basicAuth) {
    try {
      basicAuth = JSON.parse(basicAuth);
    } catch (err) {
      logger.error('invalid basic auth credentials'.red);
      return;
    }
  }

  const baseURL = options.baseURL;
  const timeout = parseFloat(options.timeout);

  if (options.saveconfigto) {
    const configPath = options.saveconfigto;
    const config = buildConfig(testSuitePath, baseURL, apiEndpoints, apiKeys,
        basicAuth, timeout);
    upsertConfig(config, configPath);
  }

  let config;
  if (options.uploadconfigfrom) {
    const configPath = options.uploadconfigfrom;
    config = getConfig(configPath);
  }

  try {
    await loadTestParameters(testSuite, baseURL, apiEndpoints, apiKeys,
        basicAuth, timeout, config);
  } catch (err) {
    logger.error(JSON.stringify(err).red);
    return;
  }
  runTestSuite();
}

module.exports = {
  generateTestSuite,
  validateApiEndpoints,
};
