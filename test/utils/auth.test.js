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
const {getSecurities, getApiKeyList, isBasicAuthRequired} =
  require('../../src/utils/auth');
const oasDoc = require('../../examples/oas_doc.json');
const apiEndpoints = [{path: '/pet', httpMethod: 'post'}];

describe('utils/auth.js', function() {
  describe('getSecurities()', function() {
    it('should return the securities(both root-level and operation-level)' +
      'of the api endpoints', function() {
      const result = getSecurities(apiEndpoints, oasDoc);
      assert.isNotEmpty(result);
    });
  });

  describe('getApiKeyList()', function() {
    it('should return apikeys required by the api endpoints', function() {
      const result = getApiKeyList(apiEndpoints, oasDoc);
      assert.isNotEmpty(result);
    });
  });

  describe('isBasicAuthRequired()', function() {
    it('should return true when basic auth is being required by atleast' +
      ' one of the apiEndpoint', function() {
      const result = isBasicAuthRequired(apiEndpoints, oasDoc);
      assert.equal(result, true);
    });
  });
});
