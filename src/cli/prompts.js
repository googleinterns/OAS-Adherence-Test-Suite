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
 * @fileoverview Contains functions that prompts the user with questions
 * and returns the user's response.
 */

const inquirer = require('inquirer');
const {isValidJSONFile} = require('../utils/app');

/*
  BaseConfig contains properties which have static values and that provides
  information about the type of prompt, response variables etc..
  Properties which take dynamic values (Example: choices) are sent as a
  different parameter called extraConfig to the prompt function.
*/
const BaseConfig = {
  oasPath: {
    type: 'input',
    name: 'oasPath',
    message: 'OAS Document Path',
    validate: function(path) {
      return (isValidJSONFile(path)) ? true :
        'Please enter a valid path for OAS 3.0 document.';
    },
  },
  testSuitePath: {
    type: 'input',
    name: 'testSuitePath',
    message: 'Path of Testsuite file',
    validate: function(path) {
      return (isValidJSONFile(path)) ? true :
        'Please enter a valid path for Testsuite file.';
    },
  },
  path: {
    type: 'input',
    name: 'path',
  },
  fileType: {
    type: 'list',
    name: 'fileType',
    message: 'Choose an Input-file type',
  },
  apiEndpoints: {
    type: 'checkbox',
    name: 'apiEndpoints',
    message: 'Select Api Endpoints',
  },
  apiKey: {
    type: 'input',
    name: 'apiKeyValue',
  },
  username: {
    type: 'input',
    name: 'username',
    message: 'username',
  },
  password: [
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
  ],
  upsertConfig: {
    type: 'confirm',
    name: 'upsertConfig',
    message: 'Want to update/create Config File',
  },
  configFilePath: {
    type: 'input',
    name: 'configFilePath',
    message: 'Config File Path',
  },
};

/**
 * Prompts the users with differnt types of questions.
 * Types of Questions: confirm(Y/n), to provide input, to select from a
 * list/checkbox etc..
 * @param {array<object>} staticConfigs Contains properties which have
 *    static values or reserved values. Example: {'type': 'confirm'}
 * @param {array<object>} dynamicConfigs Contains properties whose values are
 *    not static and changes as per the requirements or the associated usecase.
 *    Example: {'choices': ['Bread', 'Burger']}
 * @return {promise}
 */
function prompt(staticConfigs, dynamicConfigs) {
  dynamicConfigs = dynamicConfigs || [];
  const promptConfigs = [];
  staticConfigs.forEach(function(staticConfig, index) {
    const dynamicConfig = dynamicConfigs[index] || {};
    promptConfigs.push({
      type: staticConfig.type,
      name: staticConfig.name,
      message: dynamicConfig.message || staticConfig.message,
      validate: dynamicConfig.validate || staticConfig.validate,
      default: dynamicConfig.default,
      choices: dynamicConfig.choices,
    });
  });
  return inquirer.prompt(promptConfigs);
}

module.exports = {
  BaseConfig,
  prompt,
};
