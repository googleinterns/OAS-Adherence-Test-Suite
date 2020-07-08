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
 * @fileoverview Contains functions that help in generating testCases for
 * validation of request header, request body and security requirements of an
 * api endpoint and creating a testSuite file.
 */

const fs = require('fs');
const lodash = require('lodash');
const {getApiEndpoints} = require('../utils/oas');
const {logger} = require('../log');
const {DataType} = require('../constants');
const {getMockData, getMockHeaders} = require('./good_data');
const {
  getDataDeficientByDataType,
  getDataDeficientByEnum,
  getDataDeficientByNumberLimit,
  getDataDeficientByOptionalKey,
  getDataDeficientByRequiredKey,
  getDataDeficientByStringLength,
} = require('./bad_data');

/**
 * Generates positive test cases for the validation of request body.<br>
 * Positive testcases include test cases which on execution should get
 * a 2xx http status code from the server.
 * @param {object} schema Schema of request body.
 * @param {object} extras extra keys/fields to be appended to the generated
 *   test case.
 * @return {array<object>} positive testcases
 */
function getPostitveTestCaseForRequestBody(schema, extras = {}) {
  const dataDeficientByOptionalKey = getDataDeficientByOptionalKey(schema);

  let deficientDatas = [];
  deficientDatas = deficientDatas.concat(dataDeficientByOptionalKey);

  const testCases = [];
  deficientDatas.forEach(function(deficientData) {
    // To send an api request, the requestbody should be of object datatype.
    if (typeof(deficientData.data) !== DataType.OBJECT) return;
    const testCase = lodash.merge(deficientData, extras);
    testCases.push(testCase);
  });
  return testCases;
}

/**
 * Generates negative test cases for the validation of request body.<br>
 * Negative testcases include test cases which on execution should get
 * a 4xx or 5xx http status code from the server.
 * @param {object} schema Schema of request body.
 * @param {object} extras extra keys/fields to be appended to the generated
 *   test case.
 * @return {array<object>} negative testcases
 */
function getNegativeTestCaseForRequestBody(schema, extras = {}) {
  const dataDeficientByDataType = getDataDeficientByDataType(schema);
  const dataDeficientByEnum = getDataDeficientByEnum(schema);
  const dataDeficientByNumberLimit = getDataDeficientByNumberLimit(schema);
  const dataDeficientByRequiredKey = getDataDeficientByRequiredKey(schema);
  const dataDeficientByStringLength = getDataDeficientByStringLength(schema);

  let deficientDatas = [];
  deficientDatas = deficientDatas.concat(dataDeficientByDataType);
  deficientDatas = deficientDatas.concat(dataDeficientByEnum);
  deficientDatas = deficientDatas.concat(dataDeficientByNumberLimit);
  deficientDatas = deficientDatas.concat(dataDeficientByRequiredKey);
  deficientDatas = deficientDatas.concat(dataDeficientByStringLength);

  const testCases = [];
  deficientDatas.forEach(function(deficientData) {
    // To send an api request, the requestbody should be of object datatype.
    if (typeof(deficientData.data) !== DataType.OBJECT) return;
    const testCase = lodash.merge(deficientData, extras);
    testCases.push(testCase);
  });
  return testCases;
}

/**
 * Generates positive test cases for the validation of request header.<br>
 * Positive testcases include test cases which on execution should get
 * a 2xx http status code from the server.<br>
 * There are many types of parameters supported by OAS 3.0 .<br>
 * Example: query params, path params, header params, cookie params.<br>
 * The scope of the functionality is limited to only header parameters.
 * @param {object} parameters Parameter List.
 * @param {object} extras extra keys/fields to be appended to the generated
 *   test case.
 * @return {array<object>} positive testcases
 */
function getPostitveTestCaseForRequestHeader(parameters, extras = {}) {
  let deficientDatasOfAllHeaders = [];
  parameters = parameters || [];
  parameters.forEach(function(parameter) {
    if (parameter.in !== 'header') return;

    const dataDeficientByOptionalKey =
      getDataDeficientByOptionalKey(parameter.schema);

    let deficientDatas = [];
    deficientDatas = deficientDatas.concat(dataDeficientByOptionalKey);

    /*
      deficientDatas contain data of a single header parameter under test.
      In order to make an api request the other header parameters should be
      sent along with the header under test.
      So, we overwrite the deficientData with requestHeaders
      which contains the header parameter under test.
      Also, we add an attribute headerName that tells which header parameter is
      under test.
    */
    deficientDatas.forEach(function(deficientData) {
      const exampleRequestHeader = getMockHeaders(parameters);
      const deficientRequestHeader = exampleRequestHeader;
      deficientRequestHeader[parameter.name] = deficientData.data;
      deficientData.data = deficientRequestHeader;
      deficientData.headerName = parameter.name;
    });

    /* Testcase for "missing optional header". */
    if (parameter.required !== true) {
      const exampleRequestHeader = getMockHeaders(parameters);
      const deficientRequestHeader = exampleRequestHeader;
      delete deficientRequestHeader[parameter.name];

      const deficientData = {};
      deficientData.headerName = parameter.name;
      deficientData.data = deficientRequestHeader;
      deficientData.missingOptionalHeader = parameter.name;
      deficientDatas.push(deficientData);
    }

    deficientDatasOfAllHeaders =
      deficientDatasOfAllHeaders.concat(deficientDatas);
  });

  const testCases = [];
  deficientDatasOfAllHeaders.forEach(function(deficientData) {
    const testCase = lodash.merge(deficientData, extras);
    testCases.push(testCase);
  });
  return testCases;
}

/**
 * Generates negative test cases for the validation of request header.<br>
 * Negative testcases include test cases which on execution should get
 * a 4xx or 5xx http status code from the server.<br>
 * There are many types of parameters supported by OAS 3.0 .<br>
 * Example: query params, path params, header params, cookie params.<br>
 * The scope of the functionality is limited to only header parameters.
 * @param {object} parameters Parameter List.
 * @param {object} extras extra keys/fields to be appended to the generated
 *   test case.
 * @return {array<object>} negative testcases
 */
function getNegativeTestCaseForRequestHeader(parameters, extras = {}) {
  let deficientDatasOfAllHeaders = [];
  parameters = parameters || [];
  parameters.forEach(function(parameter) {
    if (parameter.in !== 'header') return;

    const dataDeficientByDataType =
      getDataDeficientByDataType(parameter.schema);
    const dataDeficientByEnum =
      getDataDeficientByEnum(parameter.schema);
    const dataDeficientByNumberLimit =
      getDataDeficientByNumberLimit(parameter.schema);
    const dataDeficientByRequiredKey =
      getDataDeficientByRequiredKey(parameter.schema);
    const dataDeficientByStringLength =
      getDataDeficientByStringLength(parameter.schema);

    let deficientDatas = [];
    deficientDatas = deficientDatas.concat(dataDeficientByDataType);
    deficientDatas = deficientDatas.concat(dataDeficientByEnum);
    deficientDatas = deficientDatas.concat(dataDeficientByNumberLimit);
    deficientDatas = deficientDatas.concat(dataDeficientByRequiredKey);
    deficientDatas = deficientDatas.concat(dataDeficientByStringLength);

    /*
      deficientDatas contain data of a single header parameter under test.
      In order to make an api request the other header parameters should be
      sent along with the header under test.
      So, we overwrite the deficientData with requestHeaders
      which contains the header parameter under test.
      Also, we add an attribute headerName that tells which header parameter is
      under test.
    */
    deficientDatas.forEach(function(deficientData) {
      const exampleRequestHeader = getMockHeaders(parameters);
      const deficientRequestHeader = exampleRequestHeader;
      deficientRequestHeader[parameter.name] = deficientData.data;
      deficientData.data = deficientRequestHeader;
      deficientData.headerName = parameter.name;
    });

    /* Testcase for "missing required header". */
    if (parameter.required === true) {
      const exampleRequestHeader = getMockHeaders(parameters);
      const deficientRequestHeader = exampleRequestHeader;
      delete deficientRequestHeader[parameter.name];

      const deficientData = {};
      deficientData.headerName = parameter.name;
      deficientData.data = deficientRequestHeader;
      deficientData.missingRequiredHeader = parameter.name;
      deficientDatas.push(deficientData);
    }

    deficientDatasOfAllHeaders =
      deficientDatasOfAllHeaders.concat(deficientDatas);
  });

  const testCases = [];
  deficientDatasOfAllHeaders.forEach(function(deficientData) {
    const testCase = lodash.merge(deficientData, extras);
    testCases.push(testCase);
  });
  return testCases;
}

/**
 * Generates testsuite for the oasDoc provided.
 * @param {object} oasDoc OAS 3.0 Document.
 * @return {object} testSuite
 */
function buildTestSuite(oasDoc) {
  const testSuite = {};
  testSuite.createdAtTimeStamp = new Date();

  /*
    oasDoc is being stored in the testSuite for the following reasons:
    1) Validation of the response(body/header) against their schema stored
        in oasDoc during the phase of execution of test cases.
    2) To dynamically capture the security requirements like
        basic auth, API keys for testing the api endpoints of user's interest.
  */
  testSuite.oasDoc = oasDoc;

  const apiEndpoints = getApiEndpoints(oasDoc);
  let apiTestSuites = [];

  apiEndpoints.forEach(function({path, httpMethod}) {
    logger.verbose(`Creating apiTestSuite for ${httpMethod} ${path}`);

    const apiSchema = oasDoc.paths[path][httpMethod];
    const apiTestSuite = {};
    apiTestSuite.apiEndpoint = {
      path,
      httpMethod,
    };

    /*
      OAS 3.0 supports multiple request body contents and media types like
      JSON, XML, form data, plain text.
      Currently, we support only the JSON format.
    */

    const requestBodySchema =
      apiSchema.requestBody.content['application/json'].schema;
    const parameters = apiSchema.parameters;
    apiTestSuite.examples = {
      requestBody: getMockData(requestBodySchema),
      requestHeader: getMockHeaders(parameters),
    };

    let positiveTestCases = [];
    positiveTestCases = positiveTestCases.concat(
        getPostitveTestCaseForRequestBody(
            requestBodySchema,
            {testForRequestBody: true}));
    positiveTestCases = positiveTestCases.concat(
        getPostitveTestCaseForRequestHeader(
            parameters,
            {testForRequestHeader: true}));

    let negativeTestCases = [];
    negativeTestCases = negativeTestCases.concat(
        getNegativeTestCaseForRequestBody(
            requestBodySchema,
            {testForRequestBody: true}));
    negativeTestCases = negativeTestCases.concat(
        getNegativeTestCaseForRequestHeader(
            parameters,
            {testForRequestHeader: true}));

    apiTestSuite.testCases = {
      positiveTestCases,
      negativeTestCases,
    };
    logger.verbose(`TestSuite for ${httpMethod} ${path} created successfully.`);
    apiTestSuites = apiTestSuites.concat(apiTestSuite);
  });
  testSuite.apiTestSuites = apiTestSuites;

  return testSuite;
}

/**
 * Builds the testSuite and save the testSuite generated in the
 * output location specified by user.
 * @param {object} oasDoc oas 3.0 document.
 * @param {string} testSuitePath path where the generated testsuite is saved
 */
function createTestSuiteFile(oasDoc, testSuitePath) {
  let testSuite = buildTestSuite(oasDoc);
  testSuite = JSON.stringify(testSuite);
  try {
    fs.writeFileSync(testSuitePath, testSuite);
    logger.info('\nTestSuite created and saved successfully at '.magenta +
        `${testSuitePath}`.magenta);
  } catch (err) {
    logger.error('\nFailure in saving the testsuite file generated in'.red +
        `${testSuitePath}`.red);
  }
}

module.exports = {
  buildTestSuite,
  createTestSuiteFile,
  getPostitveTestCaseForRequestHeader,
  getNegativeTestCaseForRequestHeader,
  getPostitveTestCaseForRequestBody,
  getNegativeTestCaseForRequestBody,
};
