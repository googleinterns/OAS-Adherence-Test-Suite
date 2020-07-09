/* eslint-disable no-undef */
const chai = require('chai');
const assert = chai.assert;
const oasDoc = require('../../examples/oas/simple_oas3.json');
const forgedOASDoc = require('../../examples/oas/forged_oas3.json');
const schema = require('../../examples/schemas/simpleschema.json');
const {
  buildTestSuite,
  createTestSuiteFile,
  getPostitveTestCaseForRequestHeader,
  getNegativeTestCaseForRequestHeader,
  getPostitveTestCaseForRequestBody,
  getNegativeTestCaseForRequestBody,
} = require('../../src/datagen/test_datagen');
const parameters = require('../../examples/schemas/parameters.json');

describe('test_datagen.js', async function() {
  describe('createTestSuiteFile()', function() {
    /*
      Should configure the output location before using it for unit testing,
      else, it will result in creating testsuite file in random location.
    */
    // createTestSuiteFile(forgedOASDoc);
  });

  describe('buildTestSuite()', function() {
    const testSuite = buildTestSuite(oasDoc);
    it('testSuite should contain the OAS 3.0 Document', function() {
      assert.exists(testSuite.oasDoc);
    });
    it('testSuite should contain the createdAttimestamp', function() {
      assert.exists(testSuite.createdAtTimeStamp);
    });
    it('testSuite should contain apiTestSuites', function() {
      assert.exists(testSuite.apiTestSuites);
    });
    it('apiTestSuite should contains apiEndpoint, examples of request body ' +
      'and request headers, positive and negative testcases', function() {
      const apiTestSuite = testSuite.apiTestSuites[0];
      assert.exists(apiTestSuite.apiEndpoint);
      assert.exists(apiTestSuite.examples.requestBody);
      assert.exists(apiTestSuite.examples.requestHeader);
      assert.exists(apiTestSuite.testCases.positiveTestCases);
      assert.exists(apiTestSuite.testCases.negativeTestCases);
    });
  });

  describe('getPostitveTestCaseForRequestBody()', function() {
    const positiveTestCaseForRequestBody =
      getPostitveTestCaseForRequestBody(
          schema,
          {testForRequestBody: true});
    it('testcase generated should contain the requestBody', function() {
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
    const negativeTestCaseForRequestBody =
      getNegativeTestCaseForRequestBody(
          schema,
          {testForRequestBody: true});
    it('testcase generated should contain the requestBody', function() {
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
          parameters,
          {testForRequestHeader: true});
    it('testcase generated should contain name of the header under test' +
      ' consideration and the requestHeader', function() {
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
          parameters,
          {testForRequestHeader: true});
    it('testcase generated should contain name of the header under test' +
      ' consideration and the requestHeader', function() {
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
