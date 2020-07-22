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
 * @fileoverview Contains functions that runs testcases for a particular
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
axios.defaults.headers.post['Content-Type'] =
  'application/json';

const axiosRetry = require('axios-retry');
axiosRetry(axios, {retries: 3, retryCondition: function(err) {
  // Retry only for requests geting timed out.
  return (err.code === 'ECONNABORTED');
}});

/**
 * Creates log statement which provides information about the testCase.
 * @param {object} testCase
 * @return {string}
 */
function testCaseLog(testCase) {
  const PAD_LENGTH = 20;
  if (!testCase.deficiency) {
    return '[Optimal Request Body/Header Check]'.padEnd(PAD_LENGTH).grey.bold;
  }
  const DeficiencyType = {
    dataType: 'DataType',
    enum: 'Enum',
    numberRange: 'Number Range',
    optionalKey: 'Optional Key Missing',
    requiredKey: 'Required Key Missing',
    stringLength: 'String Length',
  };
  const details = testCase.deficiency.details || {};
  switch (testCase.deficiency.type) {
    case DeficiencyType.dataType:
      return '[DataType Check]'.padEnd(PAD_LENGTH).grey.bold +
        ` expectedDataType: ${details.expectedDataType},`.grey +
        ` actualDataType: ${details.actualDataType}`.grey;
    case DeficiencyType.enum:
      return '[Enum Check]'.padEnd(PAD_LENGTH).grey.bold +
        ` enumList: ${details.enumList}`.grey;
    case DeficiencyType.numberRange:
      return '[Range Check]'.padEnd(PAD_LENGTH).grey.bold +
      (details.minimumAllowed) ? `Minimum: ${details.minimumAllowed}`.grey: '' +
      (details.maximumAllowed) ? `Maximum: ${details.maximumAllowed}`.grey: '';
    case DeficiencyType.optionalKey:
      return '[Optional Key Check]'.padEnd(PAD_LENGTH).grey.bold;
    case DeficiencyType.requiredKey:
      return '[Required Key Check]'.padEnd(PAD_LENGTH).grey.bold;
    case DeficiencyType.stringLength:
      return '[String Length Check]'.padEnd(PAD_LENGTH).grey.bold +
        (details.minimumLengthAllowed) ?
        `MinLength: ${details.minimumLengthAllowed}`.grey : '' +
        (details.maximumLengthAllowed) ?
        `MaxLength: ${details.maximumLengthAllowed}`.grey: '';
    default:
      return '';
  }
}

/**
 * Displays test results of each test case with test verdicts, test case
 * details and other details like errors if any.
 * @param {array<object>} testResults
 * @param {object} testVerdictCounter
 */
function displayTestResults(testResults, testVerdictCounter) {
  testResults.sort(function(testResultA, testResultB) {
    const keyA = testResultA.testCase.key;
    const keyB = testResultB.testCase.key;
    return keyA.localeCompare(keyB);
  });

  testResults.forEach(function(testResult, index) {
    const {
      testCase,
      testVerdict,
      skipValidation,
      statusCodes,
      errors} = testResult;

    if (!index || testCase.key !== testResults[index-1].testCase.key) {
      logger.info('\nTest Details for '.grey.bold + `${testCase.key}`.cyan);
    }

    const verdictLog =
        ((testVerdict.final === 'pass') ? 'PASS'.green : 'FAIL'.red) + ' ';
    const statusCodeLog = 'Status codes: ' +
        `[Received: ${statusCodes.received}, ` +
        `Expected: ${JSON.stringify(statusCodes.expected)} ]`;
    const skipLog = 'Skipped' +
        (skipValidation.responseBody ? ' [response body]': '') +
        (skipValidation.responseHeaders ? ' [response header]': '') +
        ' validation.';

    logger.info(verdictLog + testCaseLog(testCase));
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
          return (Math.trunc(statusCode/100) == expectedStatusCode[0][0]);
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

        errors.responseBody = errors.responseBody.concat(
            validateDataAgainstSchema(responseBody, responseBodySchema, '$'));

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
          errors.responseHeaders = errors.responseHeaders.concat(
              validateDataAgainstSchema(responseHeaders[header],
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
 * Executes testcases and generates test results for a particular api endpoint
 * @param {array<object>} testCases
 * @param {array<string>} expectedStatusCodes
 * @param {object} apiTestSuite  Testsuites of an api endpoint
 * @param {object} oasDoc  OAS 3.0 document
 * @param {object} axiosConfig Contains configs of an axios request
 */
async function runTestCase(testCases, expectedStatusCodes,
    apiTestSuite, oasDoc, axiosConfig) {
  const {apiEndpoint} = apiTestSuite;
  const {
    path,
    httpMethod,
  } = apiEndpoint;
  const exampleRequestBody = apiTestSuite.examples.requestBody;
  const exampleRequestHeaders = apiTestSuite.examples.requestHeader;
  const responseSchemas = oasDoc.paths[path][httpMethod].responses;

  const requestPromises = [];
  for (const testCase of testCases) {
    const requestBody =
      (testCase.testForRequestBody) ? testCase.data : exampleRequestBody;
    const requestHeaders =
      (testCase.testForRequestHeader) ? testCase.data: exampleRequestHeaders;
    // API Keys are sent along with the request headers.
    Object.assign(requestHeaders, axiosConfig.apiKeys);
    requestPromises.push(axios({
      url: apiEndpoint.path,
      baseURL: axiosConfig.baseURL,
      method: httpMethod,
      headers: requestHeaders,
      data: requestBody,
      auth: axiosConfig.basicAuth || {},
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
