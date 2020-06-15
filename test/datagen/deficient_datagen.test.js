/* eslint-disable no-undef */
const chai = require('chai');
const assert = chai.assert;

const {validateDataAgainstSchema} = require('../../src/validator');
const {
  getDataDeficientByDataType,
  getDataDeficientByEnum,
  getDataDeficientByNumberLimit,
  getDataDeficientByOptionalKey,
  getDataDeficientByRequiredKey,
  getDataDeficientByStringLength,
} = require('../../src/datagen/deficient_datagen');
const complexSchema = require('../../examples/schemas/complexschema.json');

describe('deficient_datagen.js', function() {
  describe('getDataDeficientByDataType()', function() {
    it('data deficient by datatype ' +
      'should not comply with the schema', function() {
      const results = getDataDeficientByDataType(complexSchema);
      results.forEach(function(result) {
        const error = validateDataAgainstSchema(result.data, complexSchema);
        // Each deficient data generated will have only one wrong field.
        assert.isNotEmpty(error);
        assert.equal(error.length, 1);

        assert.equal(error[0].errorType, 'DataType Error');
      });
    });
  });

  describe('getDataDeficientByEnum()', function() {
    it('data deficient by enum should ' +
      'throw error on validation against its schema', function() {
      // complexSchema contains fields with enum property.
      const results = getDataDeficientByEnum(complexSchema);
      results.forEach(function(result) {
        const error = validateDataAgainstSchema(result.data, complexSchema);
        // Each deficient data generated will have only one wrong field.
        assert.isNotEmpty(error);
        assert.equal(error.length, 1);

        assert.equal(error[0].errorType, 'Enum Error');
      });
    });
  });

  describe('getDataDeficientByNumberLimit()', function() {
    it('data deficient by number limits should ' +
      'throw error on validation against its schema', function() {
      // complexSchema contains fields with minimum and maximum property.
      const results = getDataDeficientByNumberLimit(complexSchema,
          {checkMinimum: true, checkMaximum: true});

      results.forEach(function(result) {
        const error = validateDataAgainstSchema(result.data, complexSchema);

        // Each deficient data generated should have only one wrong field.
        assert.isNotEmpty(error);
        assert.equal(error.length, 1);

        // Number can be both integer and decimal.
        try {
          assert.equal(error[0].errorType, 'Integer Range Error');
        } catch (err) {
          assert.equal(error[0].errorType, 'Number Range Error');
        }
      });
    });
  });

  describe('getDataDeficientByOptionalKey()', function() {
    it('data deficient by optional key should not ' +
      'throw error on validation against its schema', function() {
      // complexSchema contains optional keys.
      const results = getDataDeficientByOptionalKey(complexSchema);
      results.forEach(function(result) {
        const error = validateDataAgainstSchema(result.data, complexSchema);
        assert.isEmpty(error);
      });
    });
  });

  describe('getDataDeficientByRequiredKey()', function() {
    it('data deficient by required key should ' +
      'throw error on validation against its schema', function() {
      // complexSchema contains required keys.
      const results = getDataDeficientByRequiredKey(complexSchema);
      results.forEach(function(result) {
        const error = validateDataAgainstSchema(result.data, complexSchema);
        // Each deficient data generated should have only one wrong field.
        assert.isNotEmpty(error);
        assert.equal(error.length, 1);

        assert.equal(error[0].errorType, 'Required Key Error');
      });
    });
  });

  describe('getDataDeficientByStringLength()', function() {
    it('data deficient by string length constraints should ' +
      'throw error on validation against its schema', function() {
      // complexSchema contains minLength/maxLength keys.
      const results = getDataDeficientByStringLength(complexSchema,
          {checkMinimumLength: true, checkMaximumLength: true});

      results.forEach(function(result) {
        const error = validateDataAgainstSchema(result.data, complexSchema);
        // Each deficient data generated should have only one wrong field.
        assert.isNotEmpty(error);
        assert.equal(error.length, 1);

        assert.equal(error[0].errorType, 'String Length Error');
      });
    });
  });
});
