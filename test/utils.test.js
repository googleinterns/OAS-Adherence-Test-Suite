/* eslint-disable no-undef */
const chai = require('chai');
const assert = chai.assert;
const {
  getRandomNumber,
  getRandomString,
} = require('../src/utils');

describe('utils.js', function() {
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
          assert.isAtLeast(1, 1);
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
});
