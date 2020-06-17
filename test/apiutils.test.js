/* eslint-disable no-undef */
const chai = require('chai');
const assert = chai.assert;
const {getApiEndpoints} = require('../src/apiutils');
const oasDoc = require('../examples/oas/petstore_oas3.json');

describe('apiutils', function() {
  describe('getApiEndpoints()', function() {
    it('should return objects of type {path: string, httpMethod: string}',
        function() {
          const result = getApiEndpoints(oasDoc);
          result.forEach(function(result) {
            assert.exists(result.httpMethod);
            assert.exists(result.path);
          });
        });
  });
});
