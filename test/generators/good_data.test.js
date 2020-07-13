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
const {validateDataAgainstSchema} = require('../../src/validator');
const {getMockHeaders, getMockData} = require('../../src/generators/good_data');
const {Schemas} = require('../../examples/schemas');
const schemas = [Schemas.SIMPLE, Schemas.COMPLEX, Schemas.ARRAY,
  Schemas.ONEOF, Schemas.REQUIRED, Schemas.FORMAT];

describe('generators/good_data.js', function() {
  describe('getMockData', function() {
    it('should return undefined when schema is not passed', function() {
      assert.notExists(getMockData(null, '$'));
    });
    it('should not throw any errors on validation against their own schema',
        function() {
          schemas.forEach(function(schema) {
            const result = getMockData(schema, '$');
            const errors = validateDataAgainstSchema(result, schema, '$');
            assert.isEmpty(errors);
          });
        });
    it('should throw errors when validated against a non-complying schema',
        function() {
          const result = getMockData(Schemas.SIMPLE, '$');
          const errors = validateDataAgainstSchema(result, Schemas.ARRAY, '$');
          assert.isNotEmpty(errors);
        });
  });

  describe('getMockHeaders', function() {
    it('should not throw any errors on validation against their own schema',
        function() {
          const parameters = Schemas.PARAMETERS;
          const result = getMockHeaders(parameters);
          assert.isObject(result);
          parameters.forEach(function(parameter) {
            if (parameter.in === 'header') {
              assert.exists(result[parameter['name']]);
              const errors = validateDataAgainstSchema(
                  result[parameter['name']], parameter.schema, '$');
              assert.isEmpty(errors);
            }
          });
        });
    it('should throw errors when validated against a non-complying schema',
        function() {
          const parameters = Schemas.PARAMETERS;
          const result = getMockHeaders(parameters);
          assert.isObject(result);
          parameters.forEach(function(parameter) {
            if (parameter.in === 'header') {
              assert.exists(result[parameter['name']]);
              const errors = validateDataAgainstSchema(result[parameter['name']]
                  , Schemas.ARRAY, `$.${parameter['name']}`);
              assert.isNotEmpty(errors);
            }
          });
        });
  });
});
