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

/** @module utils/auth */
/**
 * @fileoverview Contains functions used for capturing the Auth requirements of
 * apiEndpoints.
 * @see https://swagger.io/docs/specification/authentication/
 */

/**
 * Accumulates and returns all the securities applied at root level,
 * operation level of the apiEndpoints passed.
 * @param {array<{httpMethod: string, path: string}>} apiEndpoints
 * @param {object} oasDoc OAS 3.0 Document
 * @return {array<object>} securities
 */
function getSecurities(apiEndpoints, oasDoc) {
  let securities = [];

  /* Root Level Securities*/
  securities = securities.concat(Object.keys((oasDoc.security || [])[0] || {}));

  /* Api-Endpoint/Operation Level Securities*/
  apiEndpoints.forEach(function({path, httpMethod}) {
    securities = securities.concat(
        Object.keys((oasDoc.paths[path][httpMethod].security || [])[0] || {}));
  });

  /* Return the securities after filtering out the redundant securities. */
  return securities.filter(function(security, index) {
    return securities.indexOf(security) == index;
  });
}

/**
 * Generates an array that contains name of apiKeys required for supporting
 *    authentication requirements of the api endpoints.
 * @param {array<{httpMethod: string, path: string}>} apiEndpoints
 * @param {object} oasDoc
 * @return {array<string>} apiKeyList
 */
function getApiKeyList(apiEndpoints, oasDoc) {
  const securitySchemes = oasDoc.components.securitySchemes || {};
  const apiKeyList = [];
  const securities = getSecurities(apiEndpoints, oasDoc);
  securities.forEach(function(security) {
    if (securitySchemes[security].type === 'apiKey') {
      apiKeyList.push(security);
    }
  });
  return apiKeyList;
}

/**
 * Checks whether Basic Authentication is required
 *    for any of the api endpoints.
 * @param {array<{httpMethod: string, path: string}>} apiEndpoints
 * @param {object} oasDoc OAS 3.0 Document
 * @return {boolean} isRequired
 */
function isBasicAuthRequired(apiEndpoints, oasDoc) {
  const securitySchemes = oasDoc.components.securitySchemes || {};
  let isRequired = false;
  const securities = getSecurities(apiEndpoints, oasDoc);
  securities.forEach(function(security) {
    if (securitySchemes[security].type === 'http' &&
        securitySchemes[security].scheme === 'basic') {
      isRequired = true;
    }
  });
  return isRequired;
}

module.exports = {
  getSecurities,
  getApiKeyList,
  isBasicAuthRequired,
};
