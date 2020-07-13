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
const {Error} = require('../../src/constants');
const {validateDataAgainstSchema} = require('../../src/validator');
const {
  getDataDeficientByDataType,
  getDataDeficientByEnum,
  getDataDeficientByNumberLimit,
  getDataDeficientByOptionalKey,
  getDataDeficientByRequiredKey,
  getDataDeficientByStringLength,
} = require('../../src/generators/bad_data');
const {Schemas} = require('../../examples/schemas');
const testCases = [
  {
    methodName: 'getDataDeficientByDataType()',
    method: getDataDeficientByDataType,
    options: null,
    errorLength: 1,
    errorType: Error.DATA_TYPE,
  },
  {
    methodName: 'getDataDeficientByEnum()',
    method: getDataDeficientByEnum,
    options: null,
    errorLength: 1,
    errorType: Error.ENUM,
  },
  {
    methodName: 'getDataDeficientByNumberLimit()',
    method: getDataDeficientByNumberLimit,
    options: {checkMinimum: true, checkMaximum: true},
    errorLength: 1,
    errorType: Error.OUT_OF_RANGE,
  },
  {
    methodName: 'getDataDeficientByOptionalKey()',
    method: getDataDeficientByOptionalKey,
    options: null,
    errorLength: 0,
  },
  {
    methodName: 'getDataDeficientByRequiredKey()',
    method: getDataDeficientByRequiredKey,
    options: null,
    errorLength: 1,
    errorType: Error.REQUIRED_KEY,
  },
  {
    methodName: 'getDataDeficientByStringLength()',
    method: getDataDeficientByStringLength,
    options: {checkMinimumLength: true, checkMaximumLength: true},
    errorLength: 1,
    errorType: Error.OUT_OF_RANGE,
  },
];

describe('generators/bad_data.js', function() {
  testCases.forEach(function(testCase) {
    const deficientDataGenerator = testCase.method;
    const options = testCase.options;
    it(`On validation data genererated by ${testCase.methodName} ` +
     'should throw Error', function() {
      const results = deficientDataGenerator(Schemas.COMPLEX, '$', {}, options);
      results.forEach(function(result) {
        const errors =
          validateDataAgainstSchema(result.data, Schemas.COMPLEX, '$');
        assert.equal(errors.length, testCase.errorLength);
        if (testCase.errorLength) {
          assert.equal(errors[0].errorType, testCase.errorType);
        }
      });
    });
  });
});
