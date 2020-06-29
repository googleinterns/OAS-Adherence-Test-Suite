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

/** @module utils/config */
/**
 * @fileoverview contains function that can create, fetch, update config.
 */

const fs = require('fs');
const {logger} = require('../log');

/**
 * builds a config object with provided information.
 * @param {string} testSuitePath path of testsuite file
 * @param {string} baseURL baseURL of the api endpoints
 * @param {array<{httpMethod: string, path: string}>} apiEndpoints
 * @param {array<{name:string, value: string}>} apiKeys
 * @param {object} basicAuth
 * @param {number} timeout maximum request-duration
 * @return {object} config
 */
function buildConfig(testSuitePath, baseURL, apiEndpoints, apiKeys,
    basicAuth, timeout) {
  const config = {};
  config.testSuitePath = testSuitePath;
  config.baseURL = baseURL;
  config.createdAt = new Date();
  config.apiEndpoints = apiEndpoints;
  config.apiKeys = apiKeys;
  config.basicAuth = basicAuth;
  config.timeout = timeout;
  return config;
}

/**
 * reads the config object present in config file.
 * @param {string} configPath path of config file.
 * @return {object} config
 */
function getConfig(configPath) {
  let config;
  try {
    config = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(config);
    return config;
  } catch (err) {
    logger.error(`failed to upload config file from ${configPath}`.red);
    return null;
  }
}

/**
 * UPdate + inSERT equals upsert which basically updates the config file if
 * already present, else creates a new file with the config object.
 * @param {object} config config object
 * @param {string} configPath path of config file.
 */
function upsertConfig(config, configPath) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config), 'utf8');
    logger.verbose(
        `\nconfig file updated/created at (${configPath})\n`.magenta);
  } catch (error) {
    logger.error('\nconfig file update/create failed\n'.red);
  }
}

module.exports = {
  buildConfig,
  getConfig,
  upsertConfig,
};
