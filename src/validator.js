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
 * @fileoverview Contains functions which validate data against a schema.
 */

const validator = require('validator');
const ipRegex = require('ip-regex');
const isNumber = require('is-number');
const isInteger = require('is-integer');
const {SchemaFormat, DataType} = require('./constants');
const {logger} = require('./log');

/**
 * Returns error if data is not of Boolean Data type.<br>
 * Note: Data should't be a logical condition which returns a boolean value,
 * it should be a Boolean false or Boolean true.
 * @param {*} data Input Data.
 * @param {object} schema Specification of the Boolean.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @param {string} [identifier = '$'] Name of the Boolean key/field.
 * @return {Array< object >} Array of Errors.
 */
function isBoolean(data, schema, options = {}, identifier = '$') {
  let errors = [];
  if (!(data === true || data === false)) {
    errors = errors.concat([{
      errorType: 'Boolean Error',
      errorDetails: {
        key: identifier,
        value: data,
      },
    }]);
  }
  return errors;
}

/**
 * Returns error if the items of array doesn't comply with the schema.
 * @param {Array} data Input Array.
 * @param {object} schema Specification of the Array.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @param {string} [identifier = '$'] Name of the Array key/field.
 * @return {Array< object >} Array of Errors.
 */
function validateArrayAgainstSchema(
    data, schema, options = {}, identifier = '$') {
  const itemSchema = schema.items;
  let errors = [];
  data = data || [];
  data.forEach(function(itemData) {
    const itemError =
      validateDataAgainstSchema(itemData, itemSchema, options, identifier);
    errors = errors.concat(itemError);
  });
  return errors;
}

/**
 * Returns error if the Number doesn't comply with the schema.
 * @param {*} data Input Data.
 * @param {object} schema Specification of the Number.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @param {string} [identifier = '$'] Name of the Number key/field.
 * @return {Array< object >} Array of Errors.
 */
function validateNumberAgainstSchema(
    data, schema, options = {}, identifier = '$') {
  const errors = [];
  if (!isNumber(data)) {
    errors.push({
      errorType: 'DataType Error',
      errorDetails: {
        key: identifier,
        value: data,
        expectedDataType: DataType.NUMBER,
        receivedDataType: typeof(data),
      },
    });
    return errors;
  }

  const low = schema.minimum;
  const high = schema.maximum;

  if ((low && data < low) || (high && data > high)) {
    errors.push({
      errorType: 'Number Range Error',
      errorDetails: {
        key: identifier,
        value: data,
        minAllowed: low,
        maxAllowed: high,
      },
    });
  }
  return errors;
}

/**
 * Returns error if the Integer doesn't comply with the schema.
 * @param {*} data Input Data.
 * @param {object} schema Specification of the Data.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @param {string} [identifier = '$'] Name of the key/field.
 * @return {Array< object >} Array of Errors.
 */
function validateIntegerAgainstSchema(
    data, schema, options = {}, identifier = '$') {
  const errors = [];
  if (!isInteger(data)) {
    errors.push({
      errorType: 'DataType Error',
      errorDetails: {
        key: identifier,
        value: data,
        expectedDataType: DataType.INTEGER,
        receivedDataType: typeof(data),
      },
    });
    return errors;
  }

  const low = schema.minimum;
  const high = schema.maximum;

  if ((low && data < low) || (high && data > high)) {
    errors.push({
      errorType: 'Integer Range Error',
      errorDetails: {
        key: identifier,
        value: data,
        minAllowed: low,
        maxAllowed: high,
      },
    });
  }
  return errors;
}

/**
 * Returns error if the Object and its property doesn't comply with the schema.
 * @param {*} data Input Data.
 * @param {object} schema Specification of the Data.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @param {string} [identifier = '$'] Name of the key/field.
 * @return {Array< object >} Array of Errors.
 */
function validateObjectAgainstSchema(
    data, schema, options = {}, identifier = '$') {
  let errors = [];
  if (typeof(data) !== DataType.OBJECT || Array.isArray(data)) {
    errors.push({
      errorType: 'DataType Error',
      errorDetails: {
        key: identifier,
        value: data,
        expectedDataType: DataType.OBJECT,
        receivedDataType: typeof(data),
      },
    });
    return errors;
  }
  if (schema.properties === undefined) {
    // [DEV] Cross-Verification Required.
    errors.push({
      errorType: 'OAS 3.0 Error',
      errorDetails: {
        key: identifier,
        value: schema,
        errorMessage: 'Object should have properties field',
      },
    });

    return errors;
  }

  const keys = Object.keys(data);
  keys.sort();

  for (let index = 1; index < keys.length; index++) {
    if (keys[index] === keys[index-1]) {
      // To avoid sending same error multiple times.
      if (index > 2 && keys[index] === keys[index-2]) continue;
      errors.push({
        errorType: 'Duplicate Key Error',
        errorDetails: {
          key: identifier,
          value: data,
          duplicateKey: keys[index],
        },
      });
    }
  }
  if (errors.length) return errors;

  if (schema.required) {
    const requiredKeys = schema.required;
    requiredKeys.forEach(function(requiredKey) {
      if (data[requiredKey] === undefined) {
        errors.push({
          errorType: 'Required Key Error',
          errorDetails: {
            key: identifier,
            value: data,
            missingKey: requiredKey,
          },
        });
      }
    });
    if (errors.length) return errors;
  }

  keys.forEach(function(key) {
    const keySchema = schema.properties[key];
    const newIdentifier = identifier + '.' + key;
    const valueError =
        validateDataAgainstSchema(data[key], keySchema, options, newIdentifier);
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
 * @param {object} [options = {}] Optional Additional Parameters.
 * @param {string} [identifier = '$'] Name of the key/field.
 * @return {Array< object >} Array of Errors.
 */
function validateStringAgainstSchema(
    data, schema, options = {}, identifier = '$') {
  const errors = [];
  if (typeof(data) !== DataType.STRING) {
    errors.push({
      errorType: 'DataType Error',
      errorDetails: {
        key: identifier,
        value: data,
        expectedDataType: DataType.STRING,
        receivedDataType: typeof(data),
      },
    });
    return errors;
  }

  if (schema.format) {
    let formatError = false;
    let errorInfo;
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
        formatError |= !ipRegex.v4(data);
        break;
      case SchemaFormat.IPV6:
        formatError |= !ipRegex.v6(data);
        break;
      default:
        errorInfo = {
          errorType: 'Limited Support Error',
          errorDetails: {
            format: schema.format,
            supportedFormats: 'email, uuid, uri, ipv4/ipv6',
          },
        };
        logger['warn'](errorInfo);
        errors.push(errorInfo);
        break;
    }

    if (formatError) {
      errors.push({
        errorType: 'Format Error',
        errorDetails: {
          key: identifier,
          value: data,
          format: schema.format,
        },
      });
    }
    return errors;
  }

  if (schema.pattern) {
    try {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(data)) {
        errors.push({
          errorType: 'Regex Mismatch Error',
          errorDetails: {
            key: identifier,
            value: data,
            pattern: schema.pattern,
            regexObject: regex,
          },
        });
      }
    } catch (err) {
      errors.push({
        errorType: 'OAS 3.0 Error',
        errorDetails: {
          key: identifier,
          value: data,
          pattern: schema.pattern,
          errorMessage: 'Invalid Regex Expression',
        },
      });
    }
    return errors;
  }

  const low = schema.minLength;
  const high = schema.maxLength;

  if ((low && data.length < low) || (high && data.length > high)) {
    errors.push({
      errorType: 'String Length Error',
      errorDetails: {
        key: identifier,
        value: data,
        minAllowed: low,
        maxAllowed: high,
        dataLength: data.length,
      },
    });
    return errors;
  }
  return [];
}

/**
 * Returns error if the data doesn't comply with the schema.
 * @param {*} data Input Data.
 * @param {object} schema Specification of the Data.
 * @param {object} [options = {}] Optional Additional Parameters.
 * @param {string} [identifier = '$'] Name of the key/field.
 * @return {Array< object >} Array of Errors.
 */
function validateDataAgainstSchema(
    data, schema, options = {}, identifier = '$') {
  if (schema === undefined) {
    const errors = [];
    /*
      [IMP] [DEV] Shouldn't log/throw errors when data is validated against
      a schema mentioned in schema.oneOf.
    */
    const errorInfo = {
      errorType: 'Excess of Data Error',
      errorDetails: {
        key: identifier,
        value: data,
        schema,
      },
    };
    if (options.strictValidation) {
      errors.push(errorInfo);
    }
    // logger['warn'](errorInfo);
    return errors;
  }

  if (data === undefined) {
    const errors = [];
    errors.push({
      errorType: 'Lack of Data Error',
      errorDetails: {
        key: identifier,
        value: data,
        schema,
      },
    });
    return errors;
  }

  if (schema.oneOf) {
    const errors = [];

    const schemas = schema.oneOf;
    let oneOfError = true;
    schemas.forEach(function(schema) {
      const childErrors = validateDataAgainstSchema(
          data, schema, options, identifier);
      if (!childErrors.length) oneOfError = false;
    });

    if (oneOfError) {
      errors.push({
        errorType: 'oneOf Error',
        errorDetails: {
          key: identifier,
          value: data,
          schemaList: JSON.stringify(schema.oneOf),
        },
      });
    }
    return errors;
  }

  if (schema.type !== typeof(data)) {
    const errors = [];
    /*
      Extra check for schema.type = "integer" and schema.type = "array"
      as "integer", "array" are not built-in datatypes in Javascript.
    */
    if ((schema.type === DataType.INTEGER && isInteger(data)) ||
      (schema.type === DataType.ARRAY && Array.isArray(data))) {
      // Don't throw error.
    } else {
      errors.push({
        errorType: 'DataType Error',
        errorDetails: {
          key: identifier,
          value: data,
          expectedDataType: schema.type,
          receivedDataType: typeof(data),
        },
      });
    }
    if (errors.length) return errors;
  }

  if (schema.enum) {
    const errors = [];
    let isValid = false;

    const items = schema.enum;
    items.forEach(function(item) {
      isValid = (data === item) ? true: isValid;
    });

    if (!isValid) {
      errors.push({
        errorType: 'Enum Error',
        errorDetails: {
          key: identifier,
          value: data,
          enumList: items,
        },
      });
    }
    return errors;
  }

  switch (schema.type) {
    case DataType.BOOLEAN:
      return isBoolean(data, schema, options, identifier);
    case DataType.NUMBER:
      return validateNumberAgainstSchema(data, schema, options, identifier);
    case DataType.INTEGER:
      return validateIntegerAgainstSchema(data, schema, options, identifier);
    case DataType.STRING:
      return validateStringAgainstSchema(data, schema, options, identifier);
    case DataType.ARRAY:
      return validateArrayAgainstSchema(data, schema, options, identifier);
    case DataType.OBJECT:
      return validateObjectAgainstSchema(data, schema, options, identifier);
    default:
      logger['error']({
        key: identifier,
        value: data,
        schema,
        errorMessage: `Missed to handle some case in
        validateDataAgainstSchema Function`,
      });
      break;
  }

  return [];
}

module.exports = {
  validateDataAgainstSchema,
};
