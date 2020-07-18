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
const {getRandomNumber, getRandomString, snakeCase, overridden} =
  require('../../src/utils/app');

describe('utils/app.js', function() {
  describe('getRandomNumber()', function() {
    const testCases = [
      [undefined, undefined],
      [undefined, undefined, {returnInteger: true}],
      [undefined, 10, undefined],
      [undefined, 10, {returnInteger: true}],
      [10, undefined, undefined],
      [10, undefined, {returnInteger: true}],
      [1, 10, undefined],
      [1, 10, {returnInteger: true}],
    ];
    testCases.forEach(function(testCase) {
      const [low, high, options] = testCase;
      const result = getRandomNumber(low, high, options);
      if (options && options.returnInteger) {
        it('should return an integer', function() {
          assert.isNumber(result);
        });
      }
      if (low) {
        it('should return an number greater than low', function() {
          assert.isAtLeast(result, low);
        });
      }
      if (high) {
        it('should return an number smaller than high', function() {
          assert.isAtMost(result, high);
        });
      }
    });
  });

  describe('getRandomString()', function() {
    it('should return a random string of given length', function() {
      const lengthOfString =
        Math.abs(getRandomNumber(1, 100, {returnInteger: true}));
      const result = getRandomString(lengthOfString);
      assert.lengthOf(result, lengthOfString);
    });
  });

  describe('snakeCase()', function() {
    it('should return string in snakecase style', function() {
      assert.equal(snakeCase('testsuite runner'), 'testsuite_runner');
    });
  });

  describe('overriden()', function() {
    const overrides = {
      'data': {
        'firstname': 'Abilash',
      },
    };
    it('should return true if the field is overriden', function() {
      assert.equal(overridden('$.data.firstname', overrides), true);
    });
    it('should return false if the field is not overriden', function() {
      assert.equal(overridden('$.data.lastname', overrides), false);
    });
  });
});
