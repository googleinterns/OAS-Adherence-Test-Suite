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
 * @fileoverview Contains functions/actions that are triggered by a command.
 */

// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const {logger} = require('../log');
const {loadTestParameters} = require('../testparameters');
const {
  createTestSuiteFile,
  buildTestSuite,
} = require('../generators/test_data');
const {runTestSuite} = require('../testsuite_runner');
const {buildConfig, getConfig, upsertConfig} = require('../utils/config');
const {readFile} = require('../utils/app');
const {parseOASDoc, verifyApiEndpoints} = require('../utils/oas');
const {BaseConfig, prompt} = require('./prompts');

/**
 * Generates testsuite and creates a testSuite file in the path specified
 * by the user.
 * @param {object} options options of the command 'generate'
 */
async function generateTestSuite(options = {}) {
  if (options.verbose) {
    /*
      Overwrites the level of logger object to 'verbose' to provide extensive
      information/logs to the user.
    */
    logger.level = 'verbose';
  }

  let oasPath = options.oaspath;
  if (!oasPath) {
    const response = await prompt([BaseConfig.oasPath]);
    oasPath = response.oasPath;
  }

  let oasDoc = readFile(oasPath, 'OAS 3.0 Document');
  oasDoc = await parseOASDoc(oasDoc);
  if (!oasDoc) return;

  const title = oasDoc.info.title;
  const version = oasDoc.openapi;
  logger.verbose('Title: '.grey.bold + `${title}`.cyan);
  logger.verbose(`Version: `.grey.bold + `${version}`.cyan);

  let testSuitePath = options.testsuitepath;
  if (!testSuitePath) {
    const response = await prompt([BaseConfig.path],
        [{message: 'TestSuite Path'}]);
    testSuitePath = response.path;
  }

  const overridesPath = options.overridespath;
  let overrides = {};
  if (overridesPath) overrides = readFile(overridesPath, 'Overrides');
  if (!overrides) return;

  createTestSuiteFile(oasDoc, testSuitePath, overrides);
}

/**
 * Validates api endpoints by loading the test parameters and
 * triggering the testrunner.
 * @param {object} options Options of the command 'validate'
 */
async function validateApiEndpoints(options = {}) {
  if (options.verbose) {
    /*
      Overwrites the level of logger object to 'verbose' to provide extensive
      information/logs to the user.
    */
    logger.level = 'verbose';
  }

  const testSuitePath = options.testsuitepath;
  let testSuite = {};
  if (testSuitePath) testSuite = readFile(testSuitePath, 'Testsuite');

  const overridesPath = options.overridespath;
  let overrides = {};
  if (overridesPath) overrides = readFile(overridesPath, 'Overrides');
  if (!overrides) return;

  let apiEndpoints;
  if (options.apiendpoints) {
    try {
      apiEndpoints = JSON.parse(options.apiendpoints);
      verifyApiEndpoints(apiEndpoints);
    } catch (err) {
      logger.error('Invalid apiendpoints'.red);
      return;
    }
  }

  const oasPath = options.oaspath;
  if (oasPath) {
    let oasDoc = readFile(oasPath, 'OAS 3.0 Document');
    oasDoc = await parseOASDoc(oasDoc);
    if (!oasDoc) return;
    testSuite = buildTestSuite(oasDoc, apiEndpoints, overrides);
    logger.verbose('Testsuite created successfully.'.magenta);
  }

  let apiKeys = options.apikeys;
  if (apiKeys) {
    try {
      apiKeys = JSON.parse(apiKeys);
    } catch (err) {
      logger.error('Invalid apikeys.'.red);
      return;
    }
  }

  let basicAuth = options.basicauth;
  if (basicAuth) {
    try {
      basicAuth = JSON.parse(basicAuth);
    } catch (err) {
      logger.error('Invalid basicauth.'.red);
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
        basicAuth, timeout, overrides, config);
  } catch (err) {
    logger.error(JSON.stringify(err).red);
    logger.error('Failed loading test parameters.'.red);
    return;
  }
  runTestSuite();
}

module.exports = {
  generateTestSuite,
  validateApiEndpoints,
};
