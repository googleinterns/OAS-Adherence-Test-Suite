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

/** @module testcase_runner */
/**
 * @fileoverview contains functions that runs testcases for a particular
 * api-endpoint, build test-results, display test-results.
 */

// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const {validateDataAgainstSchema} = require('./validator');
const {logger} = require('./log');
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

/**
 * displays test results of each test case with test verdicts, test case
 * details and other details like errors if any.
 * @param {array<object>} testResults
 * @param {object} testVerdictCounter
 */
function displayTestResults(testResults, testVerdictCounter) {
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
    const necessaryTestCaseDetails = testCase;
    delete necessaryTestCaseDetails.data;
    delete necessaryTestCaseDetails.testForRequestBody;

    const verdictLog =
        ((testVerdict.final === 'pass') ? 'PASS'.green : 'FAIL'.red) + ' ' +
        JSON.stringify(necessaryTestCaseDetails).grey.bold;
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
 * Builds test-results which includes details like testVerdicts, errors if any
 * from testcases and their corresponding responses.
 * @param {array<object>} testCases
 * @param {array<object>} responses
 * @param {array<string>} expectedStatusCodes
 * @param {object} responseSchemas
 * @return {array<object>}
 */
function buildTestResults(testCases, responses, expectedStatusCodes,
    responseSchemas) {
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
              validateDataAgainstSchema(responseBody, responseBodySchema, '$'),
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
        // [DEV] This will break, check test/generators/good_data.js
        headers.forEach(function(header) {
          errors.responseHeaders =
              errors.responseHeaders.concat(
                  validateDataAgainstSchema(
                      responseHeaders[header],
                      responseHeaderSchema[header]), '$');
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
  return testResults;
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

  const testResults = buildTestResults(testCases, responses,
      expectedStatusCodes, responseSchemas);
  return testResults;
}

/*
  The 'message' event is triggered when a child process uses process.send()
  to send messages.
*/
process.on('message', async function(message) {
  const {baseURL, basicAuth, apiKeys, timeout, apiTestSuite, oasDoc} = message;
  const {apiEndpoint} = apiTestSuite;
  const axiosConfig = {baseURL, basicAuth, apiKeys, timeout};

  let testResults = [];
  const positiveTestCases = apiTestSuite.testCases.positiveTestCases;
  testResults = testResults.concat(await runTestCase(positiveTestCases,
      ['2xx'], apiTestSuite, oasDoc, axiosConfig));

  const negativeTestCases = apiTestSuite.testCases.negativeTestCases;
  testResults = testResults.concat(await runTestCase(negativeTestCases,
      ['4xx', '5xx'], apiTestSuite, oasDoc, axiosConfig));

  /* Sends the computed results to parent process.*/
  process.send({
    apiEndpoint,
    testResults,
  });
  /*
    node.js provides the option to have a back and forth communication between
    child processes and  parent/main process and hence doesn't automatically
    terminate the child process on its own.
    Once the computed results are sent back to the parent process, we terminate
    the child process as there is no need for back and forth communication.
  */
  process.exit();
});

module.exports = {
  displayTestResults,
};
