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

/** @module datagen/deficient_datagen */
/**
 * @fileoverview Contains functions which can generate data with deficiency
 * in data type/enum/number limit/optional key/required key/string length.
 */

const {getMockData} = require('./adequate_datagen');
const {getRandomString} = require('../utils');
const {DataType} = require('../constants');

const DUMMY = [{
  type: DataType.INTEGER,
  data: 1,
}, {
  type: DataType.NUMBER,
  data: 1.10,
}, {
  type: DataType.STRING,
  data: 'ats',
}, {
  type: DataType.OBJECT,
  data: {'name': 'ats'},
}, {
  type: DataType.ARRAY,
  data: [1, 2, 3],
}, {
  type: DataType.BOOLEAN,
  data: false,
}];

/**
 * Generates random objects of a schema with one of the key of object
 *    having a different datatype from the one specified in the schema.
 * @param {object} schema Specification of data.
 * @param {string} [identifier = '$'] Name of the key/field/object.
 * @return {Array<object>} deficientData
 */
function getDataDeficientByDataType(schema, identifier='$') {
  if (!schema) return [];

  const deficientData = [];

  if (schema.oneOf) {
    const schemas = schema.oneOf;
    schemas.forEach(function(schema) {
      deficientData.concat(
          getDataDeficientByDataType(schema, identifier));
    });
    return deficientData;
  }

  if (schema.type === DataType.ARRAY) {
    const deficientDatasOfItem =
      getDataDeficientByDataType(schema.items, identifier);
    deficientDatasOfItem.forEach(function(deficientDataOfItem) {
      deficientData.push({
        key: '[]' + deficientDataOfItem.key,
        data: [deficientDataOfItem.data],
        expectedDataType: deficientDataOfItem.expectedDataType,
        actualDataType: deficientDataOfItem.actualDataType,
      });
    });
  }

  if (schema.type === DataType.OBJECT) {
    const keys = Object.keys(schema.properties);
    keys.forEach(function(key) {
      const keySchema = schema.properties[key];
      const deficientDatasOfKey =
        getDataDeficientByDataType(keySchema, identifier + '.' + key);
      deficientDatasOfKey.forEach(function(deficientDataOfKey) {
        const object = getMockData(schema);
        object[key] = deficientDataOfKey.data;
        deficientData.push({
          key: deficientDataOfKey.key,
          data: object,
          expectedDataType: deficientDataOfKey.expectedDataType,
          actualDataType: deficientDataOfKey.actualDataType,
        });
      });
    });
  }

  DUMMY.forEach(function(dummy) {
    if (dummy.type === schema.type) return;
    /*
      Number can be both integer/decimal value, therefore we skip the
      below case as it doesnt bring deficiency in data .
    */
    if (dummy.type === DataType.INTEGER &&
      schema.type === DataType.NUMBER) return;
    deficientData.push({
      key: identifier,
      data: dummy.data,
      expectedDataType: schema.type,
      actualDataType: dummy.type,
    });
  });
  return deficientData;
}

/**
 * Generates random objects of a schema with one of the key of object
 *    having a value not specified in the EnumList of the key.
 * @param {object} schema Specification of data
 * @param {string} [identifier = '$'] Name of the key/field/object
 * @return {Array<object>} deficientData
 */
function getDataDeficientByEnum(schema, identifier='$') {
  if (!schema) return [];

  if (schema.oneOf) {
    const deficientData = [];
    const schemas = schema.oneOf;
    schemas.forEach(function(schema) {
      const childDeficientData = getDataDeficientByEnum(schema, identifier);
      deficientData.concat(childDeficientData);
    });
    return deficientData;
  }

  if (schema.enum) {
    const deficientData = [];
    // Get confirmation from hosts.
    DUMMY.forEach(function(dummy) {
      if (dummy.type === schema.type) {
        deficientData.push({
          key: identifier,
          data: dummy.data,
          enumList: schema.enum,
        });
      }
    });
  }

  if (schema.type === DataType.ARRAY) {
    const deficientData = [];
    const deficientDatasOfItem =
      getDataDeficientByEnum(schema.items, identifier) || [];
    deficientDatasOfItem.forEach(function(deficientDataOfItem) {
      deficientData.push({
        key: 'item' + deficientDataOfItem.key,
        data: [deficientDataOfItem.data],
        enumList: deficientDataOfItem.enumList,
      });
    });
    return deficientData;
  }

  if (schema.type === DataType.OBJECT) {
    const deficientData = [];
    const keys = Object.keys(schema.properties);
    keys.forEach(function(key) {
      const keySchema = schema.properties[key];
      const deficientDatasOfKey =
            getDataDeficientByEnum(keySchema, identifier + '.' + key) || [];
      deficientDatasOfKey.forEach(function(deficientDataOfKey) {
        const object = getMockData(schema);
        object[key] = deficientDataOfKey.data;
        deficientData.push({
          key: deficientDataOfKey.key,
          data: object,
          enumList: deficientDataOfKey.enumList,
        });
      });
    });
    return deficientData;
  }
  return [];
}

/**
 * Generates random objects of a schema with one of the key of object
 *    having a number out of the bounds, specified in schema.
 * @param {object} schema Specification of data
 * @param {object} [options = {}] Optional Additional parameters.
 * @param {boolean=} options.checkMinimum Checks for schema.minimum and returns
 *    data with values less than schema.minimum.
 * @param {boolean=} options.checkMaximum Checks for schema.maximum and returns
 *    data with values more than schema.minimum.
 * @param {string} [identifier = '$'] Name of the key/field/object
 * @return {Array<object>} deficientData
 */
function getDataDeficientByNumberLimit(
    schema, options = {}, identifier = '$') {
  if (!schema) return [];

  if (schema.oneOf) {
    const deficientData = [];
    const schemas = schema.oneOf;
    schemas.forEach(function(schema) {
      const childDeficientData =
        getDataDeficientByNumberLimit(schema, options, identifier);
      deficientData.concat(childDeficientData);
    });
    return deficientData;
  }

  if (schema.type === DataType.NUMBER || schema.type === DataType.INTEGER) {
    const deficientData = [];
    if (options.checkMinimum && schema.minimum) {
      deficientData.push({
        key: identifier,
        data: schema.minimum - 1,
        minimumAllowed: schema.minimum,
      });
    }
    if (options.checkMaximum && schema.maximum) {
      deficientData.push({
        key: identifier,
        data: schema.maximum + 1,
        maximumAllowed: schema.maximum,
      });
    }
    return deficientData;
  }

  if (schema.type === DataType.ARRAY) {
    const deficientData = [];
    const deficientDatasOfItem = getDataDeficientByNumberLimit(
        schema.items, options, identifier + '[]') || [];
    deficientDatasOfItem.forEach(function(deficientDataOfItem) {
      if (options.checkMinimum && deficientDataOfItem.minimumAllowed) {
        deficientData.push({
          key: deficientDataOfItem.key,
          data: [deficientDataOfItem.data],
          minimumAllowed: deficientDataOfItem.minimumAllowed,
        });
      }
      if (options.checkMaximum && deficientDataOfItem.maximumAllowed) {
        deficientData.push({
          key: deficientDataOfItem.key,
          data: [deficientDataOfItem.data],
          maximumAllowed: deficientDataOfItem.maximumAllowed,
        });
      }
    });
    return deficientData;
  }

  if (schema.type === DataType.OBJECT) {
    const deficientData = [];
    const keys = Object.keys(schema.properties);
    keys.forEach(function(key) {
      const keySchema = schema.properties[key];
      const deficientDatasOfKey =
        getDataDeficientByNumberLimit(
            keySchema, options, identifier + '.' + key) || [];
      deficientDatasOfKey.forEach(function(deficientDataOfKey) {
        const object = getMockData(schema);
        object[key] = deficientDataOfKey.data;
        if (options.checkMinimum && deficientDataOfKey.minimumAllowed) {
          deficientData.push({
            key: deficientDataOfKey.key,
            data: object,
            minimumAllowed: deficientDataOfKey.minimumAllowed,
          });
        }
        if (options.checkMaximum && deficientDataOfKey.maximumAllowed) {
          deficientData.push({
            key: deficientDataOfKey.key,
            data: object,
            maximumAllowed: deficientDataOfKey.maximumAllowed,
          });
        }
      });
    });
    return deficientData;
  }
  return [];
}

/**
 * Generates random objects of a schema leaving one of the optional key.
 * @param {object} schema Specification of data
 * @param {string} [identifier = '$'] Name of the key/field/object
 * @return {Array<object>} deficientData
 */
function getDataDeficientByOptionalKey(schema, identifier='$') {
  if (!schema) return [];

  if (schema.oneOf) {
    const deficientData = [];
    const schemas = schema.oneOf;
    schemas.forEach(function(schema) {
      const childDeficientData =
        getDataDeficientByOptionalKey(schema, identifier);
      deficientData.concat(childDeficientData);
    });
    return deficientData;
  }

  if (schema.type === DataType.ARRAY) {
    const deficientData = [];
    const deficientDatasOfItem =
    getDataDeficientByOptionalKey(schema.items, identifier) || [];
    deficientDatasOfItem.forEach(function(deficientDataOfItem) {
      deficientData.push({
        data: [deficientDataOfItem.data],
        missingOptionalKey: deficientDataOfItem.missingOptionalKey,
      });
    });
    return deficientData;
  }

  if (schema.type === DataType.OBJECT) {
    const deficientData = [];
    const keys = Object.keys(schema.properties);
    keys.forEach(function(key) {
      const keySchema = schema.properties[key];
      const deficientDatasOfKey =
      getDataDeficientByOptionalKey(keySchema, identifier + '.' + key) || [];
      deficientDatasOfKey.forEach(function(deficientDataOfKey) {
        const object = getMockData(schema);
        object[key] = deficientDataOfKey.data;

        deficientData.push({
          data: object,
          missingOptionalKey: deficientDataOfKey.missingOptionalKey,
        });
      });
    });

    const requiredKeys = schema.required || [];
    keys.forEach(function(key) {
      if (!requiredKeys.includes(key)) {
        const object = getMockData(schema);
        delete object[key];
        deficientData.push({
          data: object,
          missingOptionalKey: identifier + '.' + key,
        });
      }
    });
    return deficientData;
  }
  return [];
}

/**
 * Generates random objects of a schema leaving one of the required key.
 * @param {object} schema Specification of data
 * @param {string} [identifier = '$'] Name of the key/field/object
 * @return {Array<object>} deficientData
 */
function getDataDeficientByRequiredKey(schema, identifier='$') {
  if (!schema) return [];

  if (schema.oneOf) {
    const deficientData = [];
    const schemas = schema.oneOf;
    schemas.forEach(function(schema) {
      const childDeficientData =
        getDataDeficientByRequiredKey(schema, identifier);
      deficientData.concat(childDeficientData);
    });
    return deficientData;
  }

  if (schema.type === DataType.ARRAY) {
    const deficientData = [];
    const deficientDatasOfItem =
    getDataDeficientByRequiredKey(schema.items, identifier) || [];
    deficientDatasOfItem.forEach(function(deficientDataOfItem) {
      deficientData.push({
        data: [deficientDataOfItem.data],
        missingRequiredKey: deficientDataOfItem.missingRequiredKey,
      });
    });
    return deficientData;
  }

  if (schema.type === DataType.OBJECT) {
    const deficientData = [];
    const keys = Object.keys(schema.properties);
    keys.forEach(function(key) {
      const keySchema = schema.properties[key];
      const deficientDatasOfKey =
      getDataDeficientByRequiredKey(keySchema, identifier + '.' + key) || [];
      deficientDatasOfKey.forEach(function(deficientDataOfKey) {
        const object = getMockData(schema);
        object[key] = deficientDataOfKey.data;
        deficientData.push({
          data: object,
          missingRequiredKey: deficientDataOfKey.missingRequiredKey,
        });
      });
    });

    const requiredKeys = schema.required || [];
    keys.forEach(function(key) {
      if (requiredKeys.includes(key)) {
        const object = getMockData(schema);
        delete object[key];
        deficientData.push({
          data: object,
          missingRequiredKey: identifier + '.' + key,
        });
      }
    });
    return deficientData;
  }

  return [];
}

/**
 * Generates random objects of a schema with one of the key of object
 *    having a string length out of the bounds, specified in schema.
 * @param {object} schema Specification of data
 * @param {object} [options = {}] Optional Additional parameters.
 * @param {boolean=} options.checkMinimumLength Checks for schema.minLength and
 *    returns strings with length less than schema.minLength.
 * @param {boolean=} options.checkMaximumLength Checks for schema.maxLength and
 *    returns strings with length more than schema.maxLength.
 * @param {string} [identifier = '$'] Name of the key/field/object
 * @return {Array<object>} deficientData
 */
function getDataDeficientByStringLength(
    schema, options = {}, identifier = '$') {
  if (!schema) return [];

  if (schema.oneOf) {
    const deficientData = [];
    const schemas = schema.oneOf;
    schemas.forEach(function(schema) {
      const childDeficientData =
        getDataDeficientByStringLength(schema, options, identifier) || [];
      deficientData.concat(childDeficientData);
    });
    return deficientData;
  }

  if (schema.type === DataType.STRING) {
    const deficientData = [];
    if (options.checkMinimumLength && schema.minLength) {
      deficientData.push({
        key: identifier,
        data: getRandomString(schema.minLength-1),
        minimumLengthAllowed: schema.minLength,
      });
    }
    if (options.checkMaximumLength && schema.maxLength) {
      deficientData.push({
        key: identifier,
        data: getRandomString(schema.maxLength+1),
        maximumLengthAllowed: schema.maxLength,
      });
    }

    return deficientData;
  }

  if (schema.type === DataType.ARRAY) {
    const deficientData = [];
    const deficientDatasOfItem = getDataDeficientByStringLength(
        schema.items, options, identifier + '[]') || [];
    deficientDatasOfItem.forEach(function(deficientDataOfItem) {
      if (options.checkMinimumLength &&
          deficientDataOfItem.minimumLengthAllowed) {
        deficientData.push({
          key: deficientDataOfItem.key,
          data: [deficientDataOfItem.data],
          minimumLengthAllowed: deficientDataOfItem.minimumLengthAllowed,
        });
      }
      if (options.checkMaximumLength &&
          deficientDataOfItem.maximumLengthAllowed) {
        deficientData.push({
          key: deficientDataOfItem.key,
          data: [deficientDataOfItem.data],
          maximumLengthAllowed: deficientDataOfItem.maximumLengthAllowed,
        });
      }
    });
    return deficientData;
  }

  if (schema.type === DataType.OBJECT) {
    const deficientData = [];
    const keys = Object.keys(schema.properties);
    keys.forEach(function(key) {
      const keySchema = schema.properties[key];
      const deficientDatasOfItem = getDataDeficientByStringLength(
          keySchema, options, identifier + '.' + key) || [];
      deficientDatasOfItem.forEach(function(deficientDataOfItem) {
        const object = getMockData(schema);
        object[key] = deficientDataOfItem.data;
        if (options.checkMinimumLength &&
          deficientDataOfItem.minimumLengthAllowed) {
          deficientData.push({
            key: deficientDataOfItem.key,
            data: object,
            minimumLengthAllowed: deficientDataOfItem.minimumLengthAllowed,
          });
        }
        if (options.checkMaximumLength &&
          deficientDataOfItem.maximumLengthAllowed) {
          deficientData.push({
            key: deficientDataOfItem.key,
            data: object,
            maximumLengthAllowed: deficientDataOfItem.maximumLengthAllowed,
          });
        }
      });
    });
    return deficientData;
  }
  return [];
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
