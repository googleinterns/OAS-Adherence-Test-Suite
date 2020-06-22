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

/** @module testsuite_runner */
/**
 * @fileoverview Contains functions that runs testsuite or testcase.
 */

const axios = require('axios');
// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const equals = require('is-equal-shallow');
const {validateDataAgainstSchema} = require('./validator');

/**
 * Executes testcases and logs the test result in the terminal.
 * @param {array<object>} testCases
 * @param {array<string>} expectedStatusCodes
 * @param {object} apiTestSuite Testsuite of an api endpoint.
 * @param {object} oasDoc OAS 3.0 Document.
 */
async function runTestCase(testCases, expectedStatusCodes,
    apiTestSuite, oasDoc) {
  const {apiEndpoint} = apiTestSuite;
  const {
    path,
    httpMethod,
  } = apiEndpoint;
  const url = 'https://petstore.swagger.io/v2' + apiEndpoint.path;
  const exampleRequestBody = apiTestSuite.examples.requestBody;
  const exampleRequestHeaders = apiTestSuite.examples.requestHeaders;
  const apiResponseSchemas = oasDoc.paths[path][httpMethod].responses;

  for (const testCase of testCases) {
    let requestBody;
    let requestHeaders;
    if (testCase.testForRequestBody) {
      requestBody = testCase.data;
      requestHeaders = exampleRequestHeaders;
    } else if (testCase.testForRequestHeaders) {
      requestHeaders = testCase.data;
      requestBody = exampleRequestBody;
    }

    let responseStatusCode;
    let responseBody;
    let responseHeaders;
    try {
      const response = await axios({
        url,
        method: httpMethod,
        headers: requestHeaders,
        data: requestBody,
      });
      responseStatusCode = response.status;
      responseBody = response.data;
      responseHeaders = response.headers;
    } catch (error) {
      responseStatusCode = error.response.status;
      responseBody = error.response.data;
      responseHeaders = error.response.headers;
    }

    /*
      initialTestVerdict asserts the expected response code with
      received response code.
      Example:
        Recieved Staus Code: 200
        Expected Status Code: '2xx'
        initialTestVerdict = 'pass'
    */
    const initialTestVerdict = expectedStatusCodes.some(
        function(expectedStatusCode) {
          return (responseStatusCode/100 == expectedStatusCode[0]);
        }) ? 'pass': 'fail';

    /*
      Filter out unnecessary data from the testcase ,
      in order to present only the necessary details to the user.
    */
    delete testCase.data;
    delete testCase.testForRequestBody;

    const testLog = `Test Run for ${httpMethod} ${url}.\n` +
      `Test Case Details [${JSON.stringify(testCase)}]\n` +
      `Expected http Status code ${JSON.stringify(expectedStatusCodes)}.\n` +
      `Received http status code ${responseStatusCode}`;

    /*
      finalTestVerdict takes care of the validation of responseBody and
      responseHeaders received against the schema.
    */
    let finalTestVerdict = 'pass';
    let responseBodyErrors = [];
    let responseHeaderErrors = [];

    if (initialTestVerdict === 'pass') {
      console.log(`${testLog}`.green.bold);

      /*
        Validate the response body against the schema
        if provided in the oasDoc.
      */
      try {
        const responseSchemaOfStatusCode =
            apiResponseSchemas[responseStatusCode];
        const responseBodySchema =
            responseSchemaOfStatusCode.content['application/json'].schema;

        responseBodyErrors = responseBodyErrors.concat(
            validateDataAgainstSchema(responseBody, responseBodySchema));
        if (responseBodyErrors.length) finalTestVerdict = 'fail';
      } catch (err) {
        const logStatement = 'Skipped Validation for responseBody.\n' +
        `Reason: Schema for response body of { ${responseStatusCode} ` +
        'status code, JSON format } is not provided in oasDoc.';
        console.log(logStatement.yellow);
      }

      /*
        Validate the response headers against the schema
        if provided in the oasDoc.
      */
      try {
        const responseSchemaOfStatusCode =
            apiResponseSchemas[responseStatusCode];
        const responseHeaderSchema =
            responseSchemaOfStatusCode.headers;
        const keys = Object.keys(responseHeaderSchema);
        keys.forEach(function(key) {
          responseHeaderErrors =
              responseHeaderErrors.concat(
                  validateDataAgainstSchema(
                      responseHeaders[key],
                      responseHeaderSchema[key]));
        });
        if (responseHeaderErrors.length) finalTestVerdict = 'fail';
      } catch (err) {
        const logStatement = 'Skipped Validation for responseHeaders.\n' +
        `Reason: Schema for response headers of { ${responseStatusCode} ` +
        'status code, JSON format } is not provided in oasDoc.';
        console.log(logStatement.yellow);
      }
    } else {
      console.log(`${testLog}`.red.bold);
    }

    if (finalTestVerdict === 'fail') {
      if (responseHeaderErrors.length) {
        console.log('Error Details of responseHeaders'.yellow.bold);
        console.log(`${JSON.stringify(responseHeaderErrors)}`.magenta);
      }

      if (responseBodyErrors.length) {
        console.log('Error Details of responseBody'.yellow.bold);
        console.log(`${JSON.stringify(responseBodyErrors)}`.magenta);
      }
    }
    console.log('\n\n');
  }
}

/**
 * Unloads the test paramters loaded by loadTestParameters() and runs
 * testcases against api endpoints of user's interest
 */
function runTestSuite() {
  const {testParams} = require('./testparameters');
  const {
    apiEndpointsToTest,
    testSuiteFile,
  } = testParams;
  const oasDoc = testSuiteFile.oasDoc;
  const apiTestSuites = testSuiteFile.apiTestSuites;

  apiTestSuites.forEach(function(apiTestSuite) {
    const {apiEndpoint} = apiTestSuite;

    // Check if the apiEndpoint is being asked to test by the user.
    const toBeTested = apiEndpointsToTest.some(function(apiEndpointToTest) {
      return equals(apiEndpoint, apiEndpointToTest);
    });
    if (!toBeTested) return;

    const positiveTestCases = apiTestSuite.testCases.positiveTestCases;
    runTestCase(positiveTestCases, ['2xx'], apiTestSuite, oasDoc);
    const negativeTestCases = apiTestSuite.testCases.negativeTestCases;
    runTestCase(negativeTestCases, ['4xx', '5xx'], apiTestSuite, oasDoc);
  });
}

module.exports = {
  runTestSuite,
  runTestCase,
};
