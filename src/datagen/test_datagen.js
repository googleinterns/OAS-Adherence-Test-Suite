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

/** @module datagen/test_datagen */
/**
 * @fileoverview Contain functions that help in generating testSuites and
 * storing them in a file.
 */

const _ = require('lodash');
const timestamp = require('time-stamp');
const unixTimestamp = require('unix-timestamp');
unixTimestamp.round = true;
/*
  [HOST] The above module uses BSD-3-Clause license.
  Please let me know if it is against our license policy.
  https://www.npmjs.com/package/unix-timestamp
*/
const {getApiEndpoints} = require('../apiutils');
const {logger} = require('../log');
const {getMockData, getMockHeaders} = require('./adequate_datagen');
const {
  getDataDeficientByDataType,
  getDataDeficientByEnum,
  getDataDeficientByNumberLimit,
  getDataDeficientByOptionalKey,
  getDataDeficientByRequiredKey,
  getDataDeficientByStringLength,
} = require('./deficient_datagen');

/**
 * Generates positive tests for the validation of request body.
 * Positive tests include test cases which on execution should get
 * a 2xx http status code from the server.
 * @param {object} requestBodySchema Schema of request body.
 * @param {object} extras extra keys/fields to be appended to the generated
 *   test case.
 * @return {array<object>} positiveTests
 */
function getPostitveTestsRequestBody(requestBodySchema, extras) {
  const positiveTests = [];
  let deficientDatas = [];
  const dataDeficientByOptionalKey =
    getDataDeficientByOptionalKey(requestBodySchema);
  deficientDatas = deficientDatas.concat(dataDeficientByOptionalKey);

  deficientDatas.forEach(function(deficientData) {
    const testCase = _.merge(deficientData, extras);
    positiveTests.push(testCase);
  });
  return positiveTests;
}

/**
 * Generates negative tests for the validation of request body.
 * Negative tests include test cases which on execution shouldn't get
 * a 2xx http status code from the server.
 * @param {object} requestBodySchema Schema of request body.
 * @param {object} extras extra keys/fields to be appended to the generated
 *   test case.
 * @return {array<object>} negativeTests
 */
function getNegativeTestsRequestBody(requestBodySchema, extras) {
  const negativeTests = [];
  let deficientDatas = [];

  const dataDeficientByDataType =
    getDataDeficientByDataType(requestBodySchema);
  const dataDeficientByEnum =
    getDataDeficientByEnum(requestBodySchema);
  const dataDeficientByNumberLimit =
    getDataDeficientByNumberLimit(requestBodySchema);
  const dataDeficientByRequiredKey =
    getDataDeficientByRequiredKey(requestBodySchema);
  const dataDeficientByStringLength =
    getDataDeficientByStringLength(requestBodySchema);

  deficientDatas = deficientDatas.concat(dataDeficientByDataType);
  deficientDatas = deficientDatas.concat(dataDeficientByEnum);
  deficientDatas = deficientDatas.concat(dataDeficientByNumberLimit);
  deficientDatas = deficientDatas.concat(dataDeficientByRequiredKey);
  deficientDatas = deficientDatas.concat(dataDeficientByStringLength);

  deficientDatas.forEach(function(deficientData) {
    const testCase = _.merge(deficientData, extras);
    negativeTests.push(testCase);
  });
  return negativeTests;
}

/**
 * Generates testsuite for the oasDoc provided.
 * @param {object} oasDoc OAS 3.0 Document.
 * @return {object} testSuite
 */
function buildTestSuite(oasDoc) {
  logger['info']('buildTestSuite() invoked.');

  const testSuite = {};
  testSuite.createdAtTimeStamp = timestamp();
  testSuite.createdAtUnixTimeStamp = unixTimestamp.now();

  /*
    oasDoc is being stored in the testSuite for:
    1) Validation of the response(body/header) against their schema during the
        phase of execution of test cases.
    2) Dynamically collecting the security requirements like basic auth,
        API keys for testing the api endpoints of user's interest.
  */
  testSuite.oasDoc = JSON.stringify(oasDoc);

  let apiEndpoints = getApiEndpoints(oasDoc);

  // For testing purpose. [TO BE REMOVED]
  apiEndpoints = [{'path': '/pet', 'httpMethod': 'put'}];
  let apiTestSuites = [];

  // eslint-disable-next-line no-undef
  apiEndpoints.forEach(function({path, httpMethod} = apiEndpoint) {
    logger['info'](`Creating apiTestSuite for ${httpMethod} ${path}`);

    const apiSchema = oasDoc.paths[path][httpMethod];
    const apiTestSuite = {};
    apiTestSuite.path = path;
    apiTestSuite.httpMethod = httpMethod;

    /**
     * OAS 3.0 supports multiple request body contents and media types like
     * JSON, XML, form data, plain text.
     * Currently, we support only the JSON format.
     */
    const requestBodySchema =
      apiSchema.requestBody.content['application/json'].schema;
    apiTestSuite.goodRequestBody = getMockData(requestBodySchema);

    const parameters = apiSchema.parameters;
    apiTestSuite.goodRequestHeaders = getMockHeaders(parameters);

    apiTestSuite.positiveTests =
    getPostitveTestsRequestBody(requestBodySchema, {testForRequestBody: true});
    apiTestSuite.negativeTests =
    getNegativeTestsRequestBody(requestBodySchema, {testForRequestBody: true});

    apiTestSuites = apiTestSuites.concat(apiTestSuite);
  });

  logger['info']('TestSuite created successfully!!');

  testSuite.apiTestSuites = apiTestSuites;
  return testSuite;
}

function generateTestSuiteFile(oasDoc) {
  const testSuite = buildTestSuite(oasDoc);
  console.log(testSuite);
  // Logic to save the testSuite built as {input_filename}.testsuite.json
  // in the output path specified by the user.
}

module.exports = {
  generateTestSuiteFile,
};

// [DEV] remove get requests in the oasDoc example.
