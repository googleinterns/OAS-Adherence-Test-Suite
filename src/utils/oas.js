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

/** @module utils/oas */
/**
 * @fileoverview Contains util functions scoped to OpenApi Spec (OAS).
 */

const {logger} = require('../log');
// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const SwaggerParser = require('@apidevtools/swagger-parser');

/**
 * Returns an array of all possible api Endpoints.
 * @param {object} oasDoc OAS 3.0 Document.
 * @return {array<{path: string, httpMethod: string}>} apiEndpoints
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
 * Verifies whether all the apiEndpoints are of 'post' httpMethod.
 * In case, if there are apiEndpoints which are not of 'post' httpMethod,
 * it will warn the user through logs and skip the apiEndpoint for testing.
 * @param {array<{httpMethod: string, path: string}>} apiEndpoints
 */
function verifyApiEndpoints(apiEndpoints) {
  const skipApiEndpoints = [];
  apiEndpoints.forEach(function({path, httpMethod}, index) {
    if (httpMethod !== 'post') {
      skipApiEndpoints.push({path, httpMethod});
      apiEndpoints.splice(index, 1);
    }
  });
  if (skipApiEndpoints.length) {
    skipApiEndpoints.forEach(function({path, httpMethod}) {
      logger.warn(`Skipping tests for httpMethod: ${httpMethod}`.red +
        `, path: ${path}`.red);
    });
    logger.warn('ats supports only post requests.'.gray.bold);
  }
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
    logger.verbose('OAS 3.0 Document parsed successfully.'.magenta);
    return parsedOASDoc;
  } catch (err) {
    logger.error('OAS 3.0 Document Parse Failed!! '.red);
    return null;
  }
}

module.exports = {
  getApiEndpoints,
  verifyApiEndpoints,
  parseOASDoc,
};
