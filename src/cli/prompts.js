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

/** @module cli/prompts */
/**
 * @fileoverview contains functions that prompts the user with questions
 * and returns the user's response.
 */

const inquirer = require('inquirer');
const fs = require('fs');
const {snakeCase} = require('../utils/app');

/* Supported Input File Types*/
const FileType = {
  OAS_DOC: 'oas document file',
  TESTSUITE_FILE: 'testsuite file',
};

/**
 * prompts the user with a list of supported input file types.
 * @return {promise}
 */
function fileTypePrompt() {
  return inquirer.prompt({
    type: 'list',
    name: 'fileType',
    message: 'choose an input file type',
    choices: [
      FileType.OAS_DOC,
      FileType.TESTSUITE_FILE,
    ],
  });
}

/**
 * prompts the user to provide a valid oas doc path.
 * @return {promise}
 */
function oasPathPrompt() {
  return inquirer.prompt({
    type: 'input',
    name: 'oasPath',
    message: 'oas document path',
    validate: function(oasPath) {
      try {
        let oasDoc = fs.readFileSync(oasPath, 'utf8');
        // eslint-disable-next-line no-unused-vars
        oasDoc = JSON.parse(oasDoc);
        return true;
      } catch (err) {
        return 'Please enter a valid path for oas 3.0 document';
      }
    },
  });
}

/**
 * prompts the user to provide a valid test suite path.
 * @return {promise}
 */
function testSuitePathPrompt() {
  return inquirer.prompt({
    type: 'input',
    name: 'testSuitePath',
    message: 'path of testsuite file',
    validate: function(testSuitePath) {
      try {
        let testSuite = fs.readFileSync(testSuitePath, 'utf8');
        // eslint-disable-next-line no-unused-vars
        testSuite = JSON.parse(testSuite);
        return true;
      } catch (err) {
        return 'Please enter a valid path for testsuite file';
      }
    },
  });
}

/**
 * prompts the user to select/choose the api endpoints which needs to be tested.
 * @param {array<string>} apiEndpoints
 * @return {promise}
 */
function apiEndpointPrompt(apiEndpoints) {
  return inquirer.prompt({
    type: 'checkbox',
    message: 'select api endpoints',
    name: 'apiEndpoints',
    choices: apiEndpoints,
  });
}

/**
 * prompts the user to provide username as part of basic auth credentials.
 * @return {promise}
 */
function usernamePrompt() {
  return inquirer.prompt({
    type: 'input',
    name: 'userName',
    message: 'username',
  });
}

/**
 * prompts the user to provide password and confirm password
 * as part of basic auth credentials.
 * @return {promise}
 */
function passwordPrompt() {
  return inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message: 'password',
    },
    {
      type: 'password',
      name: 'confirmPassword',
      message: 'confirm password',
    },
  ]);
}

/**
 * prompts the user to provide the value of an API key.
 * @param {string} apiKey name of the API key
 * @return {promise}
 */
function apiKeyPrompt(apiKey) {
  return inquirer.prompt({
    type: 'input',
    name: 'apiKeyValue',
    message: `[API Key] ${apiKey}`,
  });
}

/**
 * prompts the user with a Y/n question to whether update/create a config file.
 * @return {promise}
 */
function upsertConfigPrompt() {
  return inquirer.prompt({
    type: 'confirm',
    name: 'upsertConfig',
    message: 'want to update/create config file',
  });
}

/**
 * prompts the user to provide or use the defaults of config file directory path
 * and config file name.
 * @return {promise}
 */
function configDetailsPrompt() {
  const defaultConfigFileName =
    snakeCase(`config ${new Date().toDateString()}`);
  const defaultConfigDirectoryPath = require('os').homedir();
  return inquirer.prompt([
    {
      type: 'input',
      name: 'configDirectoryPath',
      message: 'config directory path',
      default: defaultConfigDirectoryPath,
    },
    {
      type: 'input',
      name: 'configFileName',
      message: 'config file name',
      default: defaultConfigFileName,
    },
  ]);
}

module.exports = {
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
};
