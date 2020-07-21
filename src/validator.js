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

/** @module validator */
/**
 * @fileoverview Contains functions which validates data against a schema and
 * provides errors(if any) with details.
 */

const validator = require('validator');
const ipRegex = require('ip-regex');
const {SchemaFormat, DataType, Error} = require('./constants');
const {buildError} = require('./utils/app');
const {logger} = require('./log');


/**
 * Returns error if data is not of Boolean Data type.<br>
 * Note: Data should't be a logical condition which returns a boolean value,
 * it should be a Boolean false or Boolean true.
 * @param {*} data Input Data.
 * @param {object} schema Schema.
 * @param {string} jsonpath jsonpath of the Boolean key/field.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @return {array<object>} Array of Errors.
 */
function isBoolean(data, schema, jsonpath, options = {}) {
  return (!(data === true || data === false)) ?
    buildError(Error.DATA_TYPE, data, jsonpath) : [];
}

/**
 * Returns error if the items of array doesn't comply with the schema.
 * @param {array} data Input Array.
 * @param {object} schema Specification of the Array.
 * @param {string} jsonpath jsonpath of the Array key/field.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @return {array<object>} Array of Errors.
 */
function validateArrayAgainstSchema(data, schema, jsonpath, options = {}) {
  if (!Array.isArray(data)) {
    return buildError(Error.DATA_TYPE, data, jsonpath,
        {dataType: {present: typeof(data), expected: DataType.ARRAY}});
  }
  const itemSchema = schema.items;
  let errors = [];
  data.forEach(function(itemData) {
    const itemError =
      validateDataAgainstSchema(itemData, itemSchema, jsonpath, options);
    errors = errors.concat(itemError);
  });
  return errors;
}

/**
 * Returns error if the numeric value doesn't comply with the schema.
 * @param {*} data Input Data.
 * @param {object} schema Specification of the Data.
 * @param {string} jsonpath jsonpath of the Numeric key/field.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @return {array<object>} Array of Errors.
 */
function validateNumericAgainstSchema(data, schema, jsonpath, options = {}) {
  if (schema.type === DataType.INTEGER && !Number.isInteger(data)) {
    return buildError(Error.DATA_TYPE, data, jsonpath,
        {dataType: {present: typeof(data), expected: DataType.INTEGER}});
  }
  if (schema.type === DataType.NUMBER && isNaN(data)) {
    return buildError(Error.DATA_TYPE, data, jsonpath,
        {dataType: {present: typeof(data), expected: DataType.NUMBER}});
  }
  const low = schema.minimum;
  const high = schema.maximum;
  if ((low && data < low) || (high && data > high)) {
    return buildError(Error.OUT_OF_RANGE, data, jsonpath, {low, high});
  }
  return [];
}

/**
 * Returns error if the Object and its property doesn't comply with the schema.
 * @param {*} data Input Data.
 * @param {object} schema Specification of the Data.
 * @param {string} jsonpath jsonpath of the Object key/field.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @return {array<object>} Array of Errors.
 */
function validateObjectAgainstSchema(data, schema, jsonpath, options = {}) {
  if (typeof(data) !== DataType.OBJECT || Array.isArray(data)) {
    return buildError(Error.DATA_TYPE, data, jsonpath,
        {dataType: {present: typeof(data), expected: DataType.OBJECT}});
  }

  let errors = [];
  if (schema.required) {
    const requiredKeys = schema.required;
    requiredKeys.forEach(function(requiredKey) {
      if (data[requiredKey] == null) {
        errors = errors.concat(
            buildError(Error.REQUIRED_KEY, null, jsonpath, {requiredKey}));
      }
    });
    if (errors.length) return errors;
  }

  const dataKeys = Object.keys(data);
  dataKeys.forEach(function(key) {
    const keySchema = schema.properties[key];
    const valueError = validateDataAgainstSchema(
        data[key], keySchema, `${jsonpath}.${key}`, options);
    errors = errors.concat(valueError);
  });
  return errors;
}

/**
 * Returns error if the String doesn't comply with the schema.<br>
 * If the schema contains multiple properties, it validates the  data against
 *    one of the property set.<br>
 *    Priority List of properties:<br>
 *        <li>  schema.format (High Priority)<br>
 *        <li>  schema.pattern<br>
 *        <li>  schema.minLength , schema.maxLength (Low Priority)<br>
 *
 *    Example: {schema.format: 'email', schema.minLength: 5} will validate
 *    the string against schema.format: 'email' as schema.format has higher
 *    priority than schema.minLength.
 * @param {*} data Input Data.
 * @param {object} schema Specification of the Data.
 * @param {string} jsonpath jsonpath of the String key/field.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @return {array<object>} Array of Errors.
 */
function validateStringAgainstSchema(data, schema, jsonpath, options = {}) {
  if (typeof(data) !== DataType.STRING) {
    return buildError(Error.DATA_TYPE, data, jsonpath,
        {dataType: {present: typeof(data), expected: DataType.STRING}});
  }

  if (schema.format) {
    let formatError = false;
    let errorObject;
    switch (schema.format) {
      case SchemaFormat.EMAIL:
        formatError |= !validator.isEmail(data);
        break;
      case SchemaFormat.UUID:
        formatError |= !validator.isUUID(data);
        break;
      case SchemaFormat.URI:
        formatError |= !validator.isURL(data);
        break;
      case SchemaFormat.IPV4:
        formatError |= !ipRegex.v4({exact: true}).test(data);
        break;
      case SchemaFormat.IPV6:
        formatError |= !ipRegex.v6({exact: true}).test(data);
        break;
      default:
        errorObject = buildError(Error.LIMITED_SUPPORT, data, jsonpath, {
          format: schema.format,
          supportedFormats: 'email, uuid, uri, ipv4/ipv6',
        });
        logger.warn(errorObject);
        return errorObject;
    }
    if (formatError) {
      return buildError(Error.FORMAT, data, jsonpath, {format: schema.format});
    }
    return [];
  }

  if (schema.pattern) {
    try {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(data)) {
        return buildError(Error.PATTERN, data, jsonpath,
            {pattern: schema.pattern, regexObject: regex});
      }
    } catch (err) {
      return buildError(Error.OAS_DOC, data, jsonpath, {
        pattern: schema.pattern,
        errorMessage: 'Invalid Pattern/Regex Expression',
      });
    }
    return [];
  }

  const low = schema.minLength;
  const high = schema.maxLength;
  if ((low && data.length < low) || (high && data.length > high)) {
    return buildError(Error.OUT_OF_RANGE, data, jsonpath,
        {low, high, stringLength: data.length});
  }
  return [];
}

/**
 * Returns error if the data doesn't comply with the schema.
 * @param {*} data Input Data.
 * @param {object} schema Specification of the Data.
 * @param {string} jsonpath jsonpath of the data.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @return {array<object>} Array of Errors.
 */
function validateDataAgainstSchema(data, schema, jsonpath, options = {}) {
  if (!schema) return [];
  if (data == null) {
    return buildError(Error.DATA_LACK, data, jsonpath, {schema});
  }
  if (schema.oneOf) {
    const schemas = schema.oneOf;
    const dataMatchedWithASchema = schemas.some(function(schema) {
      const errors = validateDataAgainstSchema(
          data, schema, jsonpath, options);
      return errors.length === 0;
    });

    if (!dataMatchedWithASchema) {
      return buildError(Error.ONE_OF, data, jsonpath,
          {oneOf: JSON.stringify(schema.oneOf)});
    }
    return [];
  }

  if (schema.enum) {
    if (typeof(data) !== schema.type) {
      return buildError(Error.DATA_TYPE, data, jsonpath, {schema});
    }
    const enumList = schema.enum;
    const dataPresentInEnumList = enumList.some(function(enumValue) {
      return (data === enumValue);
    });

    if (!dataPresentInEnumList) {
      return buildError(Error.ENUM, data, jsonpath, {enumList});
    }
    return [];
  }

  let error;
  switch (schema.type) {
    case DataType.BOOLEAN:
      return isBoolean(data, schema, jsonpath, options);
    case DataType.NUMBER:
      return validateNumericAgainstSchema(data, schema, jsonpath, options);
    case DataType.INTEGER:
      return validateNumericAgainstSchema(data, schema, jsonpath, options);
    case DataType.STRING:
      return validateStringAgainstSchema(data, schema, jsonpath, options);
    case DataType.ARRAY:
      return validateArrayAgainstSchema(data, schema, jsonpath, options);
    case DataType.OBJECT:
      return validateObjectAgainstSchema(data, schema, jsonpath, options);
    default:
      error = buildError(Error.LIMITED_SUPPORT, data, jsonpath, {schema,
        msg: 'Possibly, a new schema.type is being added to OAS 3.0 Spec.',
      });
      logger.warn(error);
      break;
  }
  return [];
}

module.exports = {
  validateDataAgainstSchema,
};
