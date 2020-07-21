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

/** @module generators/bad_data */
/**
 * @fileoverview Contains functions which can generate data with deficiency
 * in datatype/ enum/ number limit / optional key/ required key/ string length.
 */

const {getMockData} = require('./good_data');
const {getRandomString, overridden} = require('../utils/app');
const {DataType} = require('../constants');

const DUMMY = [
  {type: DataType.INTEGER, data: 1},
  {type: DataType.NUMBER, data: 1.10},
  {type: DataType.STRING, data: 'ats'},
  {type: DataType.OBJECT, data: {'name': 'ats'}},
  {type: DataType.ARRAY, data: [1, 2, 3]},
  {type: DataType.BOOLEAN, data: false},
];

/**
 * Returns deficient array. Array's Item can have wrong datatype, wrong enum
 * value, out of range values etc..
 * Array Item's deficiency is determined by the deficientDataGenerator argument.
 * @callback cb
 * @param {object} schema Specification of data.
 * @param {string} jsonpath jsonpath of the key/field.
 * @param {cb} deficientDataGenerator
 * @param {object} [overrides = {}] Keys and their overridden values.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @return {array<object>}
 */
function getDeficientArrays(schema, jsonpath, deficientDataGenerator,
    overrides = {}, options = {}) {
  const deficientArrays = [];
  const deficientItems = deficientDataGenerator(schema.items, `${jsonpath}[]`,
      overrides, options);
  deficientItems.forEach(function(deficientItem) {
    const deficientArray = {
      key: deficientItem.key,
      data: [deficientItem.data],
    };
    /*
      Since 'key', 'data' are overriden and added to the 'deficientData' object,
      remove these fields and add the rest of the fields to the deficient data
      object.
    */
    delete deficientItem.key;
    delete deficientItem.data;
    Object.assign(deficientArray, deficientItem);
    deficientArrays.push(deficientArray);
  });
  return deficientArrays;
}

/**
 * Returns deficient data from all the schemas present in the oneOf array.
 * Data's deficiency is determined by the deficientDataGenerator argument.
 * @callback cb
 * @param {array<object>} schemas Specification of data.
 * @param {string} jsonpath jsonpath of the key/field.
 * @param {cb} deficientDataGenerator
 * @param {object} [overrides = {}] Keys and their overridden values.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @return {array<object>}
 */
function getOneOfDeficientData(schemas, jsonpath, deficientDataGenerator,
    overrides = {}, options = {}) {
  let deficientDatas = [];
  schemas.forEach(function(schema) {
    deficientDatas = deficientDatas.concat(deficientDataGenerator(schema,
        jsonpath, overrides, options));
  });
  return deficientDatas;
}

/**
 * Returns deficient object. Objects's key can have wrong datatype, wrong enum
 * value, out of range values etc..
 * Object's deficiency is determined by the deficientDataGenerator argument.
 * @callback cb
 * @param {object} schema Specification of data.
 * @param {string} jsonpath jsonpath of the key/field.
 * @param {cb} deficientDataGenerator
 * @param {object} [overrides = {}] Keys and their overridden values.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @return {array<object>}
 */
function getDeficientObjects(schema, jsonpath, deficientDataGenerator,
    overrides = {}, options = {}) {
  const deficientObjects = [];
  const keys = Object.keys(schema.properties);
  keys.forEach(function(key) {
    const keySchema = schema.properties[key];
    const deficientKeys = deficientDataGenerator(keySchema,
        `${jsonpath}.${key}`, overrides, options);
    deficientKeys.forEach(function(deficientKey) {
      const data = getMockData(schema, jsonpath, overrides);
      data[key] = deficientKey.data;
      delete deficientKey.data;
      const deficientObject = Object.assign({}, {data}, deficientKey);
      deficientObjects.push(deficientObject);
    });
  });
  return deficientObjects;
}

/**
 * Generates random objects of a schema with one of the key of object
 *    having a different datatype from the one specified in the schema.
 * @param {object} schema Specification of data.
 * @param {string} jsonpath jsonpath of the key/field.
 * @param {object} overrides Keys and their overridden values.
 * @return {array<object>} deficientData
 */
function getDataDeficientByDataType(schema, jsonpath, overrides = {}) {
  if (!schema) return [];
  if (schema.oneOf) {
    return getOneOfDeficientData(schema.oneOf, jsonpath,
        getDataDeficientByDataType, overrides);
  }
  let deficientDatas = [];
  if (schema.type === DataType.ARRAY) {
    deficientDatas = deficientDatas.concat(getDeficientArrays(schema, jsonpath,
        getDataDeficientByDataType, overrides));
  }
  if (schema.type === DataType.OBJECT) {
    deficientDatas = deficientDatas.concat(getDeficientObjects(schema, jsonpath,
        getDataDeficientByDataType, overrides));
  }
  if (overridden(jsonpath, overrides)) return deficientDatas;

  DUMMY.forEach(function(dummy) {
    if (dummy.type === schema.type) return;
    /*
      Skip the below cases, as it doesn't bring any deficiency in data.
      1) (number vs integer) Number can have both integer/decimal value.
      2) (string vs integer/decimal/boolean) String can have values of
      integer/decimal/boolean datatype.
      3) (object vs array) Because array is a special variation of object
      datatype.
    */
    if (dummy.type === DataType.INTEGER &&
      schema.type === DataType.NUMBER) return;

    if ((dummy.type === DataType.INTEGER ||
        dummy.type === DataType.NUMBER ||
        dummy.type === DataType.BOOLEAN) &&
        schema.type === DataType.STRING) return;

    if (dummy.type === DataType.ARRAY &&
      schema.type === DataType.OBJECT) return;

    deficientDatas.push({
      key: jsonpath,
      data: dummy.data,
      deficiency: {
        type: 'DataType',
        details: {
          expectedDataType: schema.type,
          actualDataType: dummy.type,
        },
      },
    });
  });
  return deficientDatas;
}

/**
 * Generates random objects of a schema with one of the key of object
 *    having a value not specified in the EnumList of the key.
 * @param {object} schema Specification of data
 * @param {string} jsonpath jsonpath of the key/field.
 * @param {object} [overrides = {}] Keys and their overridden values.
 * @return {array<object>} deficientData
 */
function getDataDeficientByEnum(schema, jsonpath, overrides = {}) {
  if (!schema) return [];
  if (schema.oneOf) {
    return getOneOfDeficientData(schema.oneOf, jsonpath,
        getDataDeficientByEnum, overrides);
  }
  let deficientDatas = [];
  if (schema.type === DataType.ARRAY) {
    deficientDatas = deficientDatas.concat(getDeficientArrays(schema, jsonpath,
        getDataDeficientByEnum, overrides));
  }
  if (schema.type === DataType.OBJECT) {
    deficientDatas = deficientDatas.concat(getDeficientObjects(schema, jsonpath,
        getDataDeficientByEnum, overrides));
  }
  if (overridden(jsonpath, overrides)) return deficientDatas;

  if (schema.enum) {
    DUMMY.forEach(function(dummy) {
      if (dummy.type === schema.type) {
        deficientDatas.push({
          key: jsonpath,
          data: dummy.data,
          deficiency: {
            type: 'Enum',
            details: {
              enumList: schema.enum,
            },
          },
        });
      }
    });
  }
  return deficientDatas;
}

/**
 * Generates random objects of a schema with one of the key of object
 *    having a number out of the bounds, specified in schema.
 * @param {object} schema Specification of data
 * @param {string} jsonpath jsonpath of the key/field/object
 * @param {object} [overrides = {}] Keys and their overridden values.
 * @param {object} [options = {}] Optional Additional parameters.
 * @param {boolean=} options.checkMinimum Checks for schema.minimum and returns
 *    data with values less than schema.minimum.
 * @param {boolean=} options.checkMaximum Checks for schema.maximum and returns
 *    data with values more than schema.minimum.
 * @return {array<object>} deficientData
 */
function getDataDeficientByNumberLimit(schema, jsonpath, overrides = {},
    options = {}) {
  if (!schema) return [];
  if (schema.oneOf) {
    return getOneOfDeficientData(schema.oneOf, jsonpath,
        getDataDeficientByNumberLimit, overrides, options);
  }
  let deficientDatas = [];
  if (schema.type === DataType.ARRAY) {
    deficientDatas = deficientDatas.concat(getDeficientArrays(schema, jsonpath,
        getDataDeficientByNumberLimit, overrides, options));
  }
  if (schema.type === DataType.OBJECT) {
    deficientDatas = deficientDatas.concat(getDeficientObjects(schema, jsonpath,
        getDataDeficientByNumberLimit, overrides, options));
  }
  if (overridden(jsonpath, overrides)) return deficientDatas;

  if (schema.type === DataType.NUMBER || schema.type === DataType.INTEGER) {
    const deficientData = [];
    if (options.checkMinimum && schema.minimum) {
      deficientData.push({
        key: jsonpath,
        data: schema.minimum - 1,
        deficiency: {
          type: 'Number Range',
          details: {
            minimumAllowed: schema.minimum,
          },
        },
      });
    }
    if (options.checkMaximum && schema.maximum) {
      deficientData.push({
        key: jsonpath,
        data: schema.maximum + 1,
        deficiency: {
          type: 'Number Range',
          details: {
            maximumAllowed: schema.maximum,
          },
        },
      });
    }
    deficientDatas = deficientDatas.concat(deficientData);
  }
  return deficientDatas;
}

/**
 * Generates random objects of a schema leaving one of the optional key.
 * @param {object} schema Specification of data
 * @param {string} jsonpath jsonpath of the key/field.
 * @param {object} [overrides = {}] Keys and their overridden values.
 * @return {array<object>} deficientData
 */
function getDataDeficientByOptionalKey(schema, jsonpath, overrides = {}) {
  if (!schema) return [];
  if (schema.oneOf) {
    return getOneOfDeficientData(schema.oneOf, jsonpath,
        getDataDeficientByOptionalKey, overrides);
  }
  let deficientDatas = [];
  if (schema.type === DataType.ARRAY) {
    deficientDatas = deficientDatas.concat(getDeficientArrays(schema, jsonpath,
        getDataDeficientByOptionalKey, overrides));
  }
  if (schema.type === DataType.OBJECT) {
    deficientDatas = deficientDatas.concat(getDeficientObjects(schema, jsonpath,
        getDataDeficientByOptionalKey, overrides));
    const keys = Object.keys(schema.properties);
    const requiredKeys = schema.required || [];
    keys.forEach(function(key) {
      if (!requiredKeys.includes(key) &&
          !overridden(`${jsonpath}.${key}`, overrides)) {
        const data = getMockData(schema, jsonpath, overrides);
        delete data[key];
        deficientDatas.push({
          key: `${jsonpath}.${key}`,
          data,
          deficiency: {
            type: 'Optional Key Missing',
          },
        });
      }
    });
  }
  return deficientDatas;
}

/**
 * Generates random objects of a schema leaving one of the required key.
 * @param {object} schema Specification of data
 * @param {string} jsonpath jsonpath of the key/field/object
 * @param {object} [overrides = {}] Keys and their overridden values.
 * @return {array<object>} deficientData
 */
function getDataDeficientByRequiredKey(schema, jsonpath, overrides = {}) {
  if (!schema) return [];
  if (schema.oneOf) {
    return getOneOfDeficientData(schema.oneOf, jsonpath,
        getDataDeficientByRequiredKey, overrides);
  }
  let deficientDatas = [];
  if (schema.type === DataType.ARRAY) {
    deficientDatas = deficientDatas.concat(getDeficientArrays(schema, jsonpath,
        getDataDeficientByRequiredKey, overrides));
  }
  if (schema.type === DataType.OBJECT) {
    deficientDatas = deficientDatas.concat(getDeficientObjects(schema, jsonpath,
        getDataDeficientByRequiredKey, overrides));
    const keys = Object.keys(schema.properties);
    const requiredKeys = schema.required || [];
    keys.forEach(function(key) {
      if (requiredKeys.includes(key) &&
          !overridden(`${jsonpath}.${key}`, overrides)) {
        const data = getMockData(schema, jsonpath, overrides);
        delete data[key];
        deficientDatas.push({
          key: `${jsonpath}.${key}`,
          data,
          deficiency: {
            type: 'Required Key Missing',
          },
        });
      }
    });
  }
  return deficientDatas;
}

/**
 * Generates random objects of a schema with one of the key of object
 *    having a string length out of the bounds, specified in schema.
 * @param {object} schema Specification of data
 * @param {string} jsonpath jsonpath of the key/field.
 * @param {object} [overrides = {}] Keys and their overridden values.
 * @param {object} [options = {}] Optional Additional parameters.
 * @param {boolean=} options.checkMinimumLength Checks for schema.minLength and
 *    returns strings with length less than schema.minLength.
 * @param {boolean=} options.checkMaximumLength Checks for schema.maxLength and
 *    returns strings with length more than schema.maxLength.
 * @return {Array<object>} deficientData
 */
function getDataDeficientByStringLength(schema, jsonpath, overrides = {},
    options = {}) {
  if (!schema) return [];
  if (schema.oneOf) {
    return getOneOfDeficientData(schema.oneOf, jsonpath,
        getDataDeficientByStringLength, overrides, options);
  }
  let deficientDatas = [];
  if (schema.type === DataType.ARRAY) {
    deficientDatas = deficientDatas.concat(getDeficientArrays(schema, jsonpath,
        getDataDeficientByStringLength, overrides, options));
  }
  if (schema.type === DataType.OBJECT) {
    deficientDatas = deficientDatas.concat(getDeficientObjects(schema, jsonpath,
        getDataDeficientByStringLength, overrides, options));
  }
  if (overridden(jsonpath, overrides)) return deficientDatas;

  if (schema.type === DataType.STRING) {
    if (options.checkMinimumLength && schema.minLength) {
      deficientDatas.push({
        key: jsonpath,
        data: getRandomString(schema.minLength-1),
        deficiency: {
          type: 'String Length',
          details: {
            minimumLengthAllowed: schema.minLength,
          },
        },
      });
    }
    if (options.checkMaximumLength && schema.maxLength) {
      deficientDatas.push({
        key: jsonpath,
        data: getRandomString(schema.maxLength+1),
        deficiency: {
          type: 'String Length',
          details: {
            maximumLengthAllowed: schema.maxLength,
          },
        },
      });
    }
  }
  return deficientDatas;
}

module.exports = {
  getDataDeficientByDataType,
  getDataDeficientByEnum,
  getDataDeficientByNumberLimit,
  getDataDeficientByOptionalKey,
  getDataDeficientByRequiredKey,
  getDataDeficientByStringLength,
};

/*
  [DEV] Future additions:
    - getDataDeficientByFormat  (P2)
    - getDataDeficientByPattern (P3)
*/
