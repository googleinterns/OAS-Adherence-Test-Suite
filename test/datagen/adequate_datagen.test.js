/* eslint-disable no-undef */
const chai = require('chai');
const assert = chai.assert;
const {validateDataAgainstSchema} = require('../../src/validator');
const {
  getMockHeaders,
  getMockData,
} = require('../../src/datagen/adequate_datagen');
const simpleSchema = require('../../examples/schemas/simpleschema.json');
const complexSchema = require('../../examples/schemas/complexschema.json');
const schemaWithArrayField =
  require('../../examples/schemas/schema_arrayfield.json');
const schemaWithOneofField =
  require('../../examples/schemas/schema_oneoffield.json');
const schemaWithReqField =
  require('../../examples/schemas/schema_requiredfield.json');
const schemaWithFormatField =
  require('../../examples/schemas/schema_formatfield.json');
const schemas = [simpleSchema, complexSchema, schemaWithArrayField,
  schemaWithOneofField, schemaWithReqField, schemaWithFormatField];
const badSchema = require('../../examples/schemas/badschema.json');
const parameters = [
  {
    'name': 'api_key',
    'in': 'header',
    'schema': {
      'type': 'string',
    },
  },
  {
    'name': 'petId',
    'in': 'path',
    'description': 'Pet id to delete',
    'required': true,
    'schema': {
      'type': 'integer',
      'format': 'int64',
    },
  },
];

describe('adequate_datagen.js', function() {
  describe('getMockData', function() {
    it('data generated against bad schema should throw errors', function() {
      const result = getMockData(badSchema);
      const errors = validateDataAgainstSchema(result, badSchema);
      assert.isNotEmpty(errors);
    });

    it('should return undefined when schema is not passed', function() {
      const result = getMockData();
      assert.notExists(result);
    });

    schemas.forEach(function(schema) {
      it('data generated should comply with schema', function() {
        const result = getMockData(schema);
        const errors = validateDataAgainstSchema(result, schema);
        assert.isEmpty(errors);
      });
    });
  });

  describe('getMockHeaders', function() {
    it('headers generated should comply with schema', function() {
      const result = getMockHeaders(parameters);
      assert.isObject(result);
      parameters.forEach(function(parameter) {
        if (parameter.in === 'header') {
          assert.exists(result[parameter['name']]);
          const errors = validateDataAgainstSchema(
              result[parameter['name']], parameter.schema);
          assert.isEmpty(errors);
        }
      });
    });

    it('empty header object to be generated when no parameters are sent',
        function() {
          const result = getMockHeaders();
          assert.isEmpty(result);
        });
  });
});
