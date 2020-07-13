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

/** @module utils/app */
/**
 * @fileoverview contains generic utility functions which is not scoped
 * to a particular feature/domain. In other words, it is scoped to
 * the whole app.
 */

const {JSONPath} = require('jsonpath-plus');
const fs = require('fs');
const {logger} = require('../log');

/**
 * Generates and returns a random number(integer/float) within the limits set.
 * @param {(number|undefined)} low Minimum Limit
 * @param {(number|undefined)} high Maximum Limit
 * @param {object} [options = {}] Optional Additional parameters.
 * @param {boolean=} options.returnInteger Returns an integer.
 * @return {number} Random Number.
 */
function getRandomNumber(low, high, options = {}) {
  low = low || Number.MIN_SAFE_INTEGER;
  high = high || Number.MAX_SAFE_INTEGER;
  let result = Math.random() * (high - low) + low;
  if (options.returnInteger) result = Math.trunc(result);
  return result;
}

/**
 * Generates and returns a random string of a particular length.
 * @param {number} length Length of the random string.
 * @return {string} Random String.
 */
function getRandomString(length) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let index = 0; index < length; index++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * returns a string with lowercase string with underscores between words.
 * @param {string} sentence
 * @return {string} snake-cased sentence
 */
function snakeCase(sentence) {
  let result = '';
  const words = sentence.split(' ');
  result += words.shift().toLowerCase();
  words.forEach(function(word) {
    result += '_' + word.toLowerCase();
  });
  return result;
}

/**
 * Checks whether the field of a particular jsonpath has a
 * overridden/reserved value.
 * @param {string} jsonpath JSONPath of the Key.
 * @param {object} [overrides = {}] Keys and their overridden values.
 * @return {boolean}
 */
function overridden(jsonpath, overrides = {}) {
  // eslint-disable-next-line new-cap
  return (jsonpath !== '$' && JSONPath(jsonpath, overrides).length > 0);
}

/**
 * Checks whether the file in the provided path is a valid JSON file.
 * @param {string} path path of JSON file
 * @return {boolean}
 */
function isValidJSONFile(path) {
  try {
    const jsonObject = fs.readFileSync(path, 'utf8');
    JSON.parse(jsonObject);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Returns parsed JSON data present in the the path provided.
 * @param {string} path path of JSON file
 * @return {object}
 */
function getJSONData(path) {
  const jsonObject = fs.readFileSync(path, 'utf8');
  return JSON.parse(jsonObject);
}

/**
 * Reads data from a file present in the provided path.
 * @param {string} path Path of the file/document.
 * @param {string} fileName Name of the file/document.
 * @return {object} file
 */
function readFile(path, fileName) {
  if (isValidJSONFile(path)) {
    const file = getJSONData(path);
    logger.verbose(
        `Uploaded ${fileName} successfully from ${path}.\n`.magenta);
    return file;
  } else {
    logger.error(`${fileName} upload failed.`.red);
    return null;
  }
}

/**
 * Builds an error object with necessary details.
 * @param {string} errorType Classification of Error.(example:'Data Type Error')
 * @param {*} data
 * @param {string} jsonpath jsonpath of the data.
 * @param {object} [additionalErrorDetails = {}] Additional error details.
 * @return {array<object>}
 */
function buildError(errorType, data, jsonpath, additionalErrorDetails = {}) {
  const errorDetails = {key: jsonpath, value: data};
  Object.assign(errorDetails, additionalErrorDetails);
  return [{
    errorType,
    errorDetails,
  }];
}

module.exports = {
  getRandomNumber,
  getRandomString,
  snakeCase,
  overridden,
  readFile,
  isValidJSONFile,
  getJSONData,
  buildError,
};
