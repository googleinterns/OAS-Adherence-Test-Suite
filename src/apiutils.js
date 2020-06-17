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

/** @module apiutils */
/**
 * @fileoverview Contains util functions for api endpoints.
 */

const {logger} = require('./log');
const SwaggerParser = require('@apidevtools/swagger-parser');

/**
 * Returns an array of all possible api Endpoints.
 * @param {object} oasDoc OAS 3.0 Document.
 * @return {Array<{path: string, httpMethod: string}>} apiEndpoints
 */
function getApiEndpoints(oasDoc) {
  const apiEndpoints = [];
  const paths = Object.keys(oasDoc.paths) || [];
  paths.forEach(function(path) {
    const httpMethods = Object.keys(oasDoc.paths[path]);
    httpMethods.forEach(function(httpMethod) {
      apiEndpoints.push({
        path,
        httpMethod,
      });
    });
  });
  return apiEndpoints;
}

/**
 * Validates the OAS 3.0 document and resolves all the $ref pointers and
 * returns a de-referenced OAS 3.0 Documentation.
 * @param {object} oasDoc OAS 3.0 Document.
 * @return {object} parsed OAS 3.0 Document.
 */
async function parseOASDoc(oasDoc) {
  try {
    const parsedOASDoc = await SwaggerParser.validate(oasDoc);
    return parsedOASDoc;
  } catch (err) {
    logger['error']('OAS 3.0 Document Parse Failed!! ');
    return null;
  }
}
// [DEV] Write Unit tests.

module.exports = {
  getApiEndpoints,
  parseOASDoc,
};
