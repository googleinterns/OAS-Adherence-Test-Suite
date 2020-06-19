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

// Add @module and @overview
const path = require('path');
const fs = require('fs');
const {logger} = require('./log');
const {
  getApiKeyList,
  isBasicAuthRequired,
} = require('./auth');

function loadTestParameters(apiEndpoints) {
  let testSuiteFile;
  try {
    testSuiteFile = fs.readFileSync(path.resolve(__dirname,
        '../swagger_petstore_1.0.5_testsuite.json'), 'utf8');
  } catch (err) {
    logger['error']('Unable to load the test suite file!!!');
    return;
  }

  testSuiteFile = JSON.parse(testSuiteFile);
  testSuiteFile.oasDoc = JSON.parse(testSuiteFile.oasDoc);

  const apiKeysRequired = getApiKeyList(apiEndpoints, testSuiteFile.oasDoc);
  // Get API keys from the user.
  // Below apiKeys are a dummy value for demo purpose.
  const apiKeys = {'X-API-KEY': 'dummyValue'};

  let basicAuthCredentials;
  if (isBasicAuthRequired(apiEndpoints, testSuiteFile.oasDoc)) {
    // Get basic auth credentials from the user.
    // Below basic auth credentials is a dummy value used for demo purpose.
    basicAuthCredentials = {
      'username': 'sunar',
      'password': 'asd23ad%23',
    };
  }

  module.exports.testParams = {
    apiEndpointsToTest: apiEndpoints,
    testSuiteFile,
    basicAuthCredentials,
    apiKeys,
  };
  console.log('Exported Test Params Successfully!!');
}

// function runTest() {
//   const Mocha = require('mocha');
//   const mocha = new Mocha();
//   // https://github.com/mochajs/mocha/issues/2783
//   delete require.cache[path.resolve(__dirname, './test_runner.js')];
//   mocha.addFile(path.resolve(__dirname, './test_runner.js'));
//   mocha.run();
//   console.log('Finished Test cases');
// }

module.exports = {
  loadTestParameters,
};
