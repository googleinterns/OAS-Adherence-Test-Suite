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
    message: 'oas document path',
    validate: function(path) {
      return (isValidJSONFile(path)) ? true :
        'Please enter a valid path for oas 3.0 document';
    },
  },
  testSuitePath: {
    type: 'input',
    name: 'testSuitePath',
    message: 'path of testsuite file',
    validate: function(path) {
      return (isValidJSONFile(path)) ? true :
        'Please enter a valid path for testsuite file';
    },
  },
  fileType: {
    type: 'list',
    name: 'fileType',
    message: 'choose an input file type',
  },
  apiEndpoints: {
    type: 'checkbox',
    name: 'apiEndpoints',
    message: 'select api endpoints',
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
    message: 'want to update/create config file',
  },
  configFilePath: {
    type: 'input',
    name: 'configFilePath',
    message: 'config file path',
  },
};

/**
 * Prompts the users with differnt types of questions.
 * Types of Questions: confirm(Y/n), to provide input, to select from a
 * list/checkbox etc..
 * Similar to inquirer.prompt(), our custom prompt function takes a set of
 * questions as an array argument or a single question as an object argument.
 * @param {object | array<object>} baseConfig Contains properties which have
 *      static values and constitute to the promptConfig. Example: 'type'
 * @param {object | array<object>} extraConfig Contains properties which have
 *      dynamic values and constitute to the promptConfig. Example: 'choices'
 * @return {promise}
 */
function prompt(baseConfig, extraConfig = {}) {
  /*
    prompt can take an array of baseConfigs, extraConfigs which corresponds to
    a set of questions rather than a single question.
    In order to avoid writing concrete code for handling each and every case,
    we cast the object into an array.
  */
  if (!Array.isArray(baseConfig)) {
    baseConfig = [baseConfig];
    extraConfig = [extraConfig];
  }

  const promptConfig = [];
  for (let index = 0; index < baseConfig.length; index++) {
    baseConfig[index] = baseConfig[index] || {};
    extraConfig[index] = extraConfig[index] || {};
    promptConfig.push({
      type: baseConfig[index].type,
      name: baseConfig[index].name,
      message: extraConfig[index].message || baseConfig[index].message,
      validate: extraConfig[index].validate || baseConfig[index].validate,
      default: extraConfig[index].default,
      choices: extraConfig[index].choices,
    });
  }
  return inquirer.prompt(promptConfig);
}

module.exports = {
  prompt,
  BaseConfig,
};
