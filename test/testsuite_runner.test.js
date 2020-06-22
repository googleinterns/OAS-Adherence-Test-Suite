/* eslint-disable no-undef */
const {runTestSuite} = require('../src/testsuite_runner');
const {loadTestParameters} = require('../src/testparameters');
const apiEndpoints = [
  {
    path: '/pet',
    httpMethod: 'post',
  },
];

describe('test_runner.js', function() {
  describe('runTestSuite()', function() {
    loadTestParameters(apiEndpoints);
    /*
      To avoid shooting api request to the server,
      the below function is not invoked.
    */
    // runTestSuite();
  });
});
