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
 * @fileoverview Contains functions that runs testsuite and display test summary
 */

// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const {logger} = require('./log');
const {performance} = require('perf_hooks');
const equals = require('is-equal-shallow');
const {fork} = require('child_process');
const {displayTestResults} = require('./testcase_runner');

const testVerdictCounter = {
  pass: 0,
  fail: 0,
};

/**
 * Resets the testverdict counter.
 */
function resetTestVerdictCounter() {
  testVerdictCounter.pass = 0;
  testVerdictCounter.fail = 0;
}

/**
 * Displays test summary.
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
  const apiTestSuites = testSuite.apiTestSuites;

  resetTestVerdictCounter();

  const startTime = performance.now();

  /*
    activeChildProcesses - number of child processes that will be created and
    be in active state.
  */
  let activeChildProcesses = 0;
  for (const apiTestSuite of apiTestSuites) {
    const {apiEndpoint} = apiTestSuite;

    // Check if the apiEndpoint is being asked to test by the user.
    const toBeTested = apiEndpointsToTest.some(function(apiEndpointToTest) {
      return equals(apiEndpoint, apiEndpointToTest);
    });
    activeChildProcesses += (toBeTested)? 1 : 0;
  }

  for (const apiTestSuite of apiTestSuites) {
    const {apiEndpoint} = apiTestSuite;

    // Check if the apiEndpoint is being asked to test by the user.
    const toBeTested = apiEndpointsToTest.some(function(apiEndpointToTest) {
      return equals(apiEndpoint, apiEndpointToTest);
    });
    if (!toBeTested) return;

    const childProcess = fork('./src/testcase_runner.js');
    childProcess.send({
      baseURL,
      basicAuth,
      apiKeys,
      timeout,
      apiTestSuite,
      oasDoc: testSuite.oasDoc,
    });
    childProcess.on('message', function(message) {
      const {apiEndpoint, testResults} = message;

      logger.info('\nTest Results for  '.grey.bold +
        `${apiEndpoint.httpMethod}  ${baseURL}${apiEndpoint.path}`.cyan);
      displayTestResults(testResults, testVerdictCounter);

      activeChildProcesses--;
      if (activeChildProcesses) return;

      /*
        When there are no active child processes left (activeChildProcesses = 0)
        , we go ahead and display the final logs with test summary.
      */

      /*
        Explanation for skipping response body/headers validation is shown to
        the user after the completion of testing and displaying the test results
      */
      logger.verbose('Skipping response body/headers validation because their' +
      ' schemas are not present in the oas document provided.');

      displayTestSummary();
      const endTime = performance.now();
      displayTimeTaken(startTime, endTime);
    });
  }
}

module.exports = {
  runTestSuite,
};
