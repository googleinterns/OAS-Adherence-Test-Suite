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

/** @module auth */
/**
 * @fileoverview Contains functions used for capturing the Auth requirements of
 * apiEndpoints.
 */

/**
 * Generates an array that contains name of apiKeys required for supporting
 *    authentication requirements of the api endpoints.
 * @param {Array< {httpMethod: String, path: String} >} apiEndpoints
 * @param {Object} oasDoc
 * @return {Array<String>} apiKeyList
 */
function getApiKeyList(apiEndpoints, oasDoc) {
  const globalSecuritySchemes = oasDoc.components.securitySchemes || {};
  const apiKeyList = [];

  apiEndpoints.forEach(function(apiEndPoint) {
    const securitySchemes =
      oasDoc.paths[apiEndPoint.path][apiEndPoint.httpMethod].security || [];
    securitySchemes.forEach(function(securityScheme) {
      const securityKey = Object.keys(securityScheme)[0];
      if (globalSecuritySchemes[securityKey].type === 'apiKey') {
        apiKeyList.push(securityKey);
      }
    });
  });
  return apiKeyList;
}


/**
 * Checks whether Basic Authentication is required
 *    for any of the api endpoints.
 * @param {Array< {httpMethod: String, path: String} >} apiEndpoints
 * @param {Object} oasDoc OAS 3.0 Document
 * @return {Boolean} isRequired
 */
function isBasicAuthRequired(apiEndpoints, oasDoc) {
  const globalSecuritySchemes = oasDoc.components.securitySchemes || {};
  let isRequired = false;

  apiEndpoints.forEach(function(apiEndPoint) {
    const securitySchemes =
      oasDoc.paths[apiEndPoint.path][apiEndPoint.httpMethod].security || [];
    securitySchemes.forEach(function(securityScheme) {
      const securityKey = Object.keys(securityScheme)[0];
      if (globalSecuritySchemes[securityKey].type === 'http' &&
        globalSecuritySchemes[securityKey].scheme === 'basic') {
        isRequired = true;
      }
    });
  });
  return isRequired;
}

module.exports = {
  getApiKeyList,
  isBasicAuthRequired,
};
