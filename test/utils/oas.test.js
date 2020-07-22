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
const {getApiEndpoints, verifyApiEndpoints, parseOASDoc} =
  require('../../src/utils/oas');
const oasDoc = require('../../examples/oas_doc.json');

describe('utils/oas.js', function() {
  describe('getApiEndpoints()', function() {
    it('should return objects of type {path: string, httpMethod: string}',
        function() {
          const apiEndpoints = getApiEndpoints(oasDoc);
          apiEndpoints.forEach(function(apiEndpoint) {
            assert.exists(apiEndpoint.httpMethod);
            assert.exists(apiEndpoint.path);
          });
        });
  });

  describe('verifyApiEndpoints()', function() {
    it('verifies the api endpoints and returns only POST api endpoints',
        function() {
          const apiEndpoints = [
            {path: '/pet', httpMethod: 'post'},
            {path: '/pet', httpMethod: 'get'},
          ];
          verifyApiEndpoints(apiEndpoints);
          apiEndpoints.forEach(function({path, httpMethod}) {
            assert.equal(httpMethod, 'post');
          });
        });
  });

  describe('parseOASDoc()', async function() {
    it('should return an oasdoc with all $ref pointers resolved',
        async function() {
          const parsedOASDoc = await parseOASDoc(oasDoc);
          assert.isNotNull(parsedOASDoc);
        });
    it('should return null for an invalid oasdoc', async function() {
      const oasDoc = {'foo': 'bar'};
      const parsedOASDoc = await parseOASDoc(oasDoc);
      assert.isNull(parsedOASDoc);
    });
  });
});
