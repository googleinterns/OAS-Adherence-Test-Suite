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

/** @module utils */
/**
 * @fileoverview Contains generic utility functions used throught the code.
 */

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

module.exports = {
  getRandomNumber,
  getRandomString,
};
