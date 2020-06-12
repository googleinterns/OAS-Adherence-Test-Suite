const validator = require('validator');
const isNumber = require('is-number');
const isInteger = require('is-integer');
const {logger} = require('./Logger');
const {getJsonFieldsAtLevel} = require('./Util');

function isBoolean(data, schema, options = {}, identifier = '$') {
  let errors = [];
  /*
    Data should't be a logical condition which returns a boolean value,
    it should be a Boolean false or Boolean true.
  */
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


function validateArrayAgainstSchema(
    data, schema, options = {}, identifier = '$') {
  const itemSchema = schema.items;
  let errors = [];
  for (let index = 0; index < data.length; index++) {
    const itemError =
      validateDataAgainstSchema(data[index], itemSchema, options, identifier);

    errors = errors.concat(itemError);
  }
  return errors;
}


function validateNumberAgainstSchema(
    data, schema, options = {}, identifier = '$') {
  let errors = [];
  if (!isNumber(data)) {
    errors = errors.push({
      errorType: 'DataType Error',
      errorDetails: {
        key: identifier,
        value: data,
        expectedDataType: 'number',
        receivedDataType: typeof(data),
      },
    });
    return errors;
  }

  const low = schema.minimum;
  const high = schema.maximum;

  if ((low && data < low) || (high && data > high)) {
    errors = errors.push({
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


function validateIntegerAgainstSchema(
    data, schema, options = {}, identifier = '$') {
  let errors = [];
  if (!isInteger(data)) {
    errors = errors.push({
      errorType: 'DataType Error',
      errorDetails: {
        key: identifier,
        value: data,
        expectedDataType: 'integer',
        receivedDataType: typeof(data),
      },
    });
    return errors;
  }
  const low = schema.minimum;
  const high = schema.maximum;

  if ((low && data < low) || (high && data > high)) {
    errors = errors.push({
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


function validateObjectAgainstSchema(
    data, schema, options = {}, identifier = '$') {
  let errors = [];
  if (typeof(data) !== 'object') {
    errors = errors.push({
      errorType: 'DataType Error',
      errorDetails: {
        key: identifier,
        value: data,
        expectedDataType: 'object',
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


  const keys = getJsonFieldsAtLevel(data, 1);
  keys.sort();

  for (let index = 1; index < keys.length; index++) {
    if (keys[index] === keys[index-1]) {
      // To avoid sending same error multiple times.
      if (index > 2 && keys[index] === keys[index-2]) {
        continue;
      }
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


function validateStringAgainstSchema(
    data, schema, options = {}, identifier = '$') {
  const errors = [];
  if (typeof(data) !== 'string') {
    errors.push({
      errorType: 'DataType Error',
      errorDetails: {
        key: identifier,
        value: data,
        expectedDataType: 'string',
        receivedDataType: typeof(data),
      },
    });
    return errors;
  }
  /*
    We don't check for combined restrictions.
    Example: {minLength: 20, format: email}.
    If there are multiple condns, we check as per the below priority.
    Priority List:
      - format
      - pattern
      - minLength, maxLength
  */

  if (schema.format) {
    let formatError = false;
    switch (schema.format) {
      case 'email':
        formatError |= validator.isEmail(data);
        break;
      case 'uuid':
        formatError |= validator.isUUID(data);
        break;
      case 'uri':
        formatError |= validator.isURL(data);
        break;
      case 'ipv4':
        formatError |= validator.isIPRange(data);
        break;
      case 'ipv6':
        formatError |= validator.isIP(data);
        break;
      default:
        logger['warn']({
          errorType: 'Limited Support Error',
          errorDetails: {
            format: schema.format,
            supportedFormats: 'email, uuid, uri, ipv4/ipv6',
          },
        });
        break;
    }

    if (!formatError) {
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
    // Should we throw an error for un-supported formats???
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
  // Empty Error Array is returned.
  return errors;
}


function validateDataAgainstSchema(
    data, schema, options = {}, identifier = '$') {
  if (schema === undefined) {
    const errors = [];

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
    logger['warn'](errorInfo);
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
    schemas.forEach(function(schema) {
      const childErrors = validateDataAgainstSchema(
          data, schema, options, identifier);
      if (!childErrors.length) return [];
    });

    errors.push({
      errorType: 'oneOf Error',
      errorDetails: {
        key: identifier,
        value: data,
        schemaList: JSON.stringify(schema.oneOf),
      },
    });
    return errors;
  }


  if (schema.type !== typeof(data)) {
    const errors = [];
    /*
      Extra check for schema.type = "integer"
      as "integer" is not a built-in dataType in Javascript.
    */
    if (!(schema.type === 'integer' && typeof(data) === 'number')) {
      errors.push({
        errorType: 'DataType Mismatch Error',
        errorDetails: {
          key: identifier,
          value: data,
          expectedDataType: schema.type,
          receivedDataType: typeof(data),
        },
      });
      return errors;
    }
  }


  if (schema.enum) {
    const errors = [];
    let isValid = false;

    const items = schema.enum;
    items.forEach(function(item) {
      isValid |= (data === item);
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

  if (schema.type === 'boolean') {
    return isBoolean(data, schema, options, identifier);
  }

  if (schema.type === 'number') {
    return validateNumberAgainstSchema(data, schema, options, identifier);
  }

  if (schema.type === 'integer') {
    return validateIntegerAgainstSchema(data, schema, options, identifier);
  }

  if (schema.type === 'string') {
    return validateStringAgainstSchema(data, schema, options, identifier);
  }

  if (schema.type === 'array') {
    return validateArrayAgainstSchema(data, schema, options, identifier);
  }

  if (schema.type === 'object') {
    return validateObjectAgainstSchema(data, schema, options, identifier);
  }

  logger['error']({
    key: identifier,
    value: data,
    schema,
    errorMessage: `Missed to handle some case in
    validateDataAgainstSchema Function`,
  });

  // Returning an empty Errors Array.
  return [];
}

module.exports = {
  validateDataAgainstSchema,
};
