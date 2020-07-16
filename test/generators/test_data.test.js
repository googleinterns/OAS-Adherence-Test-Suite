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
/* eslint-disable no-undef */
const chai = require('chai');
const assert = chai.assert;
const oasDoc = require('../../examples/oas_doc.json');
const {Schemas} = require('../../examples/schemas');
// const parameters = require('../../examples/schemas/parameters.json');
const {
  buildTestSuite,
  createTestSuiteFile,
  getPostitveTestCaseForRequestHeader,
  getNegativeTestCaseForRequestHeader,
  getPostitveTestCaseForRequestBody,
  getNegativeTestCaseForRequestBody,
} = require('../../src/generators/test_data');

describe('generators/test_data.js', function() {
  describe('createTestSuiteFile()', function() {
    /*
      Should configure the output location before using it for unit testing,
      else, it will result in creating testsuite file in random location.
    */
    // createTestSuiteFile(forgedOASDoc);
  });

  describe('buildTestSuite()', function() {
    const testSuite = buildTestSuite(oasDoc);
    it('testSuite should contain the oas doc', function() {
      assert.exists(testSuite.oasDoc);
    });
    it('testSuite should contain a timestamp', function() {
      assert.exists(testSuite.createdAtTimeStamp);
    });
    it('testSuite should contain api-testsuites', function() {
      assert.exists(testSuite.apiTestSuites);
    });
    it('apiTestSuite should contains apiEndpoint info, '+
      'request-body/headers examples, testcases', function() {
      const apiTestSuite = testSuite.apiTestSuites[0];
      assert.exists(apiTestSuite.apiEndpoint);
      assert.exists(apiTestSuite.examples.requestBody);
      assert.exists(apiTestSuite.examples.requestHeader);
      assert.exists(apiTestSuite.testCases.positiveTestCases);
      assert.exists(apiTestSuite.testCases.negativeTestCases);
    });
  });

  describe('getPostitveTestCaseForRequestBody()', function() {
    const positiveTestCaseForRequestBody = getPostitveTestCaseForRequestBody(
        Schemas.SIMPLE, {testForRequestBody: true});
    it('testcase generated should contain data which corresponds to the ' +
        'requestBody', function() {
      positiveTestCaseForRequestBody.forEach(function(testCase) {
        assert.exists(testCase.data);
      });
    });
    it('testcase generated should contain the flag "testForRequestBody"' +
        ' and should be set to true', function() {
      positiveTestCaseForRequestBody.forEach(function(testCase) {
        assert.equal(testCase.testForRequestBody, true);
      });
    });
  });

  describe('getNegativeTestCaseForRequestBody()', function() {
    const negativeTestCaseForRequestBody = getNegativeTestCaseForRequestBody(
        Schemas.SIMPLE, {testForRequestBody: true});
    it('testcase generated should contain data which corresponds to the ' +
        'requestBody', function() {
      negativeTestCaseForRequestBody.forEach(function(testCase) {
        assert.exists(testCase.data);
      });
    });
    it('testcase generated should contain the flag "testForRequestBody"' +
        ' and should be set to true', function() {
      negativeTestCaseForRequestBody.forEach(function(testCase) {
        assert.equal(testCase.testForRequestBody, true);
      });
    });
  });

  describe('getPostitveTestCaseForRequestHeader()', function() {
    const positiveTestCaseForRequestHeader =
      getPostitveTestCaseForRequestHeader(
          Schemas.PARAMETERS,
          {testForRequestHeader: true});
    it('testcase generated should contain name of the header parameter under' +
      ' test and data that corresponds to the requestHeader', function() {
      positiveTestCaseForRequestHeader.forEach(function(testCase) {
        assert.exists(testCase.data);
        assert.exists(testCase.headerName);
      });
    });
    it('testcase generated should contain the flag "testForRequestHeader"' +
        ' and should be set to true', function() {
      positiveTestCaseForRequestHeader.forEach(function(testCase) {
        assert.equal(testCase.testForRequestHeader, true);
      });
    });
  });

  describe('getNegativeTestCaseForRequestHeader()', function() {
    const negativeTestCaseForRequestHeader =
      getNegativeTestCaseForRequestHeader(
          Schemas.PARAMETERS,
          {testForRequestHeader: true});
    it('testcase generated should contain name of the header parameter under' +
      ' test and data that corresponds to  requestHeader', function() {
      negativeTestCaseForRequestHeader.forEach(function(testCase) {
        assert.exists(testCase.data);
        assert.exists(testCase.headerName);
      });
    });
    it('testcase generated should contain the flag "testForRequestHeader"' +
        ' and should be set to true', function() {
      negativeTestCaseForRequestHeader.forEach(function(testCase) {
        assert.equal(testCase.testForRequestHeader, true);
      });
    });
  });
});
