/* eslint-disable no-undef */
const chai = require('chai');
const assert = chai.assert;

const {
  getApiKeyList,
  isBasicAuthRequired,
} = require('../src/auth');
const oasDoc = require('../examples/oas/petstore_oas3.json');
const apiEndpoints = [
  {
    path: '/pet',
    httpMethod: 'put',
  },
  {
    path: '/pet',
    httpMethod: 'post',
  },
  {
    path: '/store/inventory',
    httpMethod: 'get',
  },
];

describe('auth.js', function() {
  describe('getApiKeyList()', function() {
    it('should generate apiKeyList with apiKey fields ' +
      'that supports auth requirements of the apiEndpoints', function() {
      const result = getApiKeyList(apiEndpoints, oasDoc);
      assert.isNotEmpty(result);
    });

    it('should return an empty apiKeyList when there are no apikey  ' +
      'requirements for any of the apiEndpoints', function() {
      const result = getApiKeyList([], oasDoc);
      assert.isEmpty(result);
    });
  });

  describe('isBasicAuthRequired()', function() {
    it('should return true when basic auth is required for atleast' +
      ' one of the apiEndpoints to meet its auth requirements', function() {
      const result = isBasicAuthRequired(apiEndpoints, oasDoc);
      assert.equal(result, true);
    });

    it('should return false when basic auth is not required for any' +
      ' of the apiEndpoints', function() {
      const result = isBasicAuthRequired([], oasDoc);
      assert.equal(result, false);
    });
  });
});
