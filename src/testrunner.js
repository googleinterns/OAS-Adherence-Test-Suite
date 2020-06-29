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
 * @fileoverview contains functions that runs testsuite, testcase and
 * display the test results with errors if any.
 */

const axios = require('axios');
/*
  axios.all() method takes promises as an input, and returns a single promise as
  an output. This returned promise will resolve when allof  the input's promises
  have resolved. It rejects immediately upon any of the input promises being
  rejected.
  To disable the 'Fast fail approach' being used by axios.all(), and capturing
  the responses even for the rejected promises we set 'validateStatus' to 'null'
*/
axios.defaults.validateStatus = null;

const axiosRetry = require('axios-retry');
axiosRetry(axios, {retries: 3, retryCondition: function(err) {
  // retry only for requests geting timed out.
  return (err.code === 'ECONNABORTED');
}});

// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const {logger} = require('./log');
const {performance} = require('perf_hooks');
const equals = require('is-equal-shallow');
const {validateDataAgainstSchema} = require('./validator');

const testVerdictCounter = {
  pass: 0,
  fail: 0,
};

/**
 * resets the testverdict counter
 */
function resetTestVerdictCounter() {
  testVerdictCounter.pass = 0;
  testVerdictCounter.fail = 0;
}

/**
 * displays test summary
 */
function displayTestSummary() {
  logger.info('\nTest Summary '.grey.bold);
  logger.info('passing: '.grey + `${testVerdictCounter.pass} `.green);
  logger.info('failing: '.grey + `${testVerdictCounter.fail} `.red);
  let adherencePercentage = (testVerdictCounter.pass/
      (testVerdictCounter.pass + testVerdictCounter.fail))*100;
  adherencePercentage = Math.round(adherencePercentage * 100) / 100;
  logger.info('adherence percentage: '.grey + `${adherencePercentage}`.cyan);
}

/**
 * displays the time taken for the execution of testsuite
 * @param {number} startTime time at which execution of testsuite started
 * @param {number} endTime time at which execution of testsuite ended
 */
function displayTimeTaken(startTime, endTime) {
  let millisecond = endTime - startTime;
  millisecond = Math.round(millisecond * 100) / 100;
  logger.info('time taken: '.grey + `${millisecond} ms`);
}

/**
 * displays test results of each test case with test verdicts, test case
 * details and other details like errors if any.
 * @param {object} testResults
 */
function displayTestResults(testResults) {
  testResults.forEach(function(testResult) {
    const {
      testCase,
      testVerdict,
      skipValidation,
      statusCodes,
      errors} = testResult;

    /*
      Filter out unnecessary data from the testcase ,
      in order to present only the necessary details to the user.
    */
    delete testCase.data;
    delete testCase.testForRequestBody;

    const verdictLog =
        ((testVerdict.final === 'pass') ? 'PASS'.green : 'FAIL'.red) + ' ' +
        JSON.stringify(testCase).grey.bold;
    const statusCodeLog = 'status codes: ' +
        `[received: ${statusCodes.received}, ` +
        `expected: ${JSON.stringify(statusCodes.expected)} ]`;
    const skipLog = 'skipped' +
        (skipValidation.responseBody ? ' [response body]': '') +
        (skipValidation.responseHeaders ? ' [response header]': '') +
        ' validation.';

    logger.info(verdictLog);
    logger.verbose(statusCodeLog);
    if (skipValidation.responseBody || skipValidation.responseHeaders) {
      logger.verbose(skipLog);
    }
    logger.verbose('\n');

    if (testVerdict.final === 'pass') {
      testVerdictCounter.pass ++;
    } else {
      testVerdictCounter.fail ++;
      if (testVerdict.initial === 'pass') {
        if (errors.responseBody.length) {
          logger.error('Response Body Errors: '.yellow.bold);
          logger.error(`${JSON.stringify(errors.responseBody)}`.magenta);
        }
        if (errors.responseHeaders.length) {
          logger.error('Response Header Errors: '.yellow.bold);
          logger.error(`${JSON.stringify(errors.responseHeaders)}`.magenta);
        }
      }
    }
  });
}

/**
 * executes testcases and generates test results for a particular api endpoint
 * @param {array<object>} testCases
 * @param {array<string>} expectedStatusCodes
 * @param {object} apiTestSuite  testsuites of an api endpoint
 * @param {object} oasDoc  oas 3.0 document
 * @param {object} axiosConfig contains configs of an axios request
 */
async function runTestCase(testCases, expectedStatusCodes,
    apiTestSuite, oasDoc, axiosConfig) {
  const {apiEndpoint} = apiTestSuite;
  const {
    path,
    httpMethod,
  } = apiEndpoint;
  const exampleRequestBody = apiTestSuite.examples.requestBody;
  const exampleRequestHeaders = apiTestSuite.examples.requestHeaders;
  const responseSchemas = oasDoc.paths[path][httpMethod].responses;

  const requestPromises = [];
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
    requestPromises.push(axios({
      url: apiEndpoint.path,
      baseURL: axiosConfig.baseURL,
      method: httpMethod,
      headers: requestHeaders,
      data: requestBody,
      timeout: axiosConfig.timeout || 5000,
    }));
  }

  let responses = [];
  await axios.all(requestPromises)
      .then(axios.spread(function(...responsePromises) {
        responses = responsePromises;
      }))
      .catch(function(err) {
        logger.error(err);
      });

  const testResults = [];
  for (let index = 0; index < responses.length; index++) {
    const testCase = testCases[index];
    const response = responses[index];
    const statusCode = response.status;
    const responseBody = response.data;
    const responseHeaders = response.headers;

    const statusCodes = {
      expected: expectedStatusCodes,
      received: statusCode,
    };

    /*
      Initial Test Verdict asserts the expected response code with
      received response code.
      Example:
        Recieved Staus Code: 200
        Expected Status Code: '2xx'
        initialTestVerdict = 'pass'

      Final Test Verdict takes care of the validation of responseBody and
      responseHeaders against their schema.
    */
    const testVerdict = {
      initial: 'pass',
      final: 'pass',
    };

    testVerdict.initial = expectedStatusCodes.some(
        function(expectedStatusCode) {
          return (statusCode/100 == expectedStatusCode[0]);
        }) ? 'pass': 'fail';


    const skipValidation = {
      responseBody: false,
      responseHeaders: false,
    };

    const errors = {
      responseBody: [],
      responseHeaders: [],
    };

    if (testVerdict.initial === 'pass') {
      /*
        Validate the response body against the schema
        if provided in the oasDoc.
      */
      try {
        const responseSchema = responseSchemas[statusCode];
        const responseBodySchema =
          responseSchema.content['application/json'].schema;

        errors.responseBody =
          errors.responseBody.concat(
              validateDataAgainstSchema(responseBody, responseBodySchema),
          );

        if (errors.responseBody.length) testVerdict.final = 'fail';
      } catch (err) {
        skipValidation.responseBody = true;
      }

      /*
        Validate the response headers against the schema
        if provided in the oasDoc.
      */
      try {
        const responseSchema = responseSchemas[statusCode];
        const responseHeaderSchema = responseSchema.headers;
        const headers = Object.keys(responseHeaderSchema);
        headers.forEach(function(header) {
          errors.responseHeaders =
              errors.responseHeaders.concat(
                  validateDataAgainstSchema(
                      responseHeaders[header],
                      responseHeaderSchema[header]));
        });
        if (errors.responseHeaders.length) testVerdict.final = 'fail';
      } catch (err) {
        skipValidation.responseHeaders = true;
      }
    } else {
      /*
        Since testVerdict.initial = 'fail',for consistency we set
        the testVerdict.final = 'fail'.
      */
      testVerdict.final = 'fail';
    }

    testResults.push({
      testCase,
      testVerdict,
      skipValidation,
      statusCodes,
      errors,
    });
  }

  displayTestResults(testResults);
}

/**
 * Unloads the test paramters loaded by loadTestParameters() and runs
 * testcases against api endpoints of user's interest
 */
async function runTestSuite() {
  const {testParams} = require('./testparameters');
  const {
    baseURL,
    apiEndpointsToTest,
    testSuite,
    basicAuth,
    apiKeys,
    timeout,
  } = testParams;
  const oasDoc = testSuite.oasDoc;
  const apiTestSuites = testSuite.apiTestSuites;
  const axiosConfig = {baseURL, timeout};

  resetTestVerdictCounter();

  const startTime = performance.now();
  for (const apiTestSuite of apiTestSuites) {
    const {apiEndpoint} = apiTestSuite;

    // Check if the apiEndpoint is being asked to test by the user.
    const toBeTested = apiEndpointsToTest.some(function(apiEndpointToTest) {
      return equals(apiEndpoint, apiEndpointToTest);
    });
    if (!toBeTested) return;

    logger.info('\nTesting  '.grey.bold +
      `${apiEndpoint.httpMethod}  ${baseURL}${apiEndpoint.path}`.cyan);
    const positiveTestCases = apiTestSuite.testCases.positiveTestCases;
    await runTestCase(positiveTestCases, ['2xx'], apiTestSuite,
        oasDoc, axiosConfig);
    const negativeTestCases = apiTestSuite.testCases.negativeTestCases;
    await runTestCase(negativeTestCases, ['4xx', '5xx'], apiTestSuite,
        oasDoc, axiosConfig);
  }

  /*
    Explanation for skipping response body/headers validation is shown to the
    user after the completion of testing and displaying the test results.
  */
  logger.verbose('Reason for skipping response body/headers validation' +
    ' is because their schemas are not present in the oas document provided.');

  displayTestSummary();
  const endTime = performance.now();
  displayTimeTaken(startTime, endTime);
}

module.exports = {
  runTestSuite,
  runTestCase,
};
