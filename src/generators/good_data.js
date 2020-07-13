/* eslint-disable new-cap */
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

/** @module generators/good_data */
/**
 * @fileoverview Contains functions which can generate random
 * data/request-body/request-headers of a given schema.
 */

const RandExp = require('randexp');
const faker = require('faker');
const {logger} = require('../log');
const {SchemaFormat, DataType} = require('../constants');
const {JSONPath} = require('jsonpath-plus');
const {getRandomNumber, getRandomString, buildError, overridden} =
  require('../utils/app');

/**
 * Generates a random integer that complies with schema.
 * @param {object} schema Specification of Integer.
 * @param {string} jsonpath jsonpath of the Integer Field.
 * @param {object} overrides Overridden Keys/fields with their values.
 * @return {number} Random Integer.
 */
function getMockInteger(schema, jsonpath, overrides = {}) {
  if (overridden(jsonpath, overrides)) {
    return JSONPath(jsonpath, overrides)[0];
  }
  const low = schema.minimum;
  const high = schema.maximum;
  return getRandomNumber(low, high, {returnInteger: true});
}

/**
 * Generates a random number(interger/decimal values) that complies with schema.
 * @param {object} schema Specification of Number.
 * @param {string} jsonpath jsonpath of the Number Field.
 * @param {object} overrides Overridden Keys/fields with their values.
 * @return {number} Random Number.
 */
function getMockNumber(schema, jsonpath, overrides = {}) {
  if (overridden(jsonpath, overrides)) {
    return JSONPath(jsonpath, overrides)[0];
  }
  const low = schema.minimum;
  const high = schema.maximum;
  return getRandomNumber(low, high);
}

/**
 * Generates a random string that complies with schema.<br>
 *    If the schema contains multiple properties, it generates data following
 *    one of the property set.<br>
 *    Priority List of properties:<br>
 *        <li>  schema.format (High Priority)<br>
 *        <li>  schema.pattern<br>
 *        <li>  schema.minLength , schema.maxLength (Low Priority)<br>
 *
 *    Example: {schema.format: 'email', schema.minLength: 5} will generate
 *    a string of 'email' format as schema.format has higher priority than
 *    schema.minLength.
 * @param {object} schema Specification of String.
 * @param {string} jsonpath jsonpath of the String Field.
 * @param {object} overrides Overridden Keys/fields with their values.
 * @return {string} Random String.
 */
function getMockString(schema, jsonpath, overrides = {}) {
  if (overridden(jsonpath, overrides)) {
    return JSONPath(jsonpath, overrides)[0];
  }
  if (schema.format) {
    switch (schema.format) {
      case SchemaFormat.EMAIL:
        return faker.internet.email();
      case SchemaFormat.UUID:
        return faker.random.uuid();
      case SchemaFormat.URI:
        return faker.internet.url();
      case SchemaFormat.IPV4:
        return faker.internet.ip();
      case SchemaFormat.IPV6:
        return faker.internet.ipv6();
      default: {
        logger.warn(buildError(Error.LIMITED_SUPPORT, null, jsonpath, {
          format: schema.format,
          supportedFormats: 'email, uuid, uri, ipv4/ipv6',
        }));
        return '';
      }
    }
  }

  if (schema.pattern) {
    try {
      const regex = new RegExp(schema.pattern);
      return new RandExp(regex).gen();
    } catch (err) {
      logger.warn(buildError(Error.PATTERN, null, jsonpath,
          {pattern: schema.pattern}));
      return '';
    }
  }

  const low = schema.minLength || 1;
  const high = schema.maxLength || low + 10;

  const lengthOfString = getRandomNumber(low, high, {returnInteger: true});
  return getRandomString(lengthOfString);
}

/**
 * Generates a random array with items that complies with schema.
 * @param {object} schema Specification of Array.
 * @param {string} jsonpath jsonpath of the Array Field.
 * @param {object} overrides Overridden Keys/fields with their values.
 * @return {array} Random Array.
 */
function getMockArray(schema, jsonpath, overrides = {}) {
  if (overridden(jsonpath, overrides)) {
    return JSONPath(jsonpath, overrides)[0];
  }
  const mockArray = [];
  const lengthOfMockArray = getRandomNumber(1, 10, {returnInteger: true});
  for (let index = 0; index < lengthOfMockArray; index++) {
    mockArray.push(getMockData(schema.items, jsonpath, overrides));
  }
  return mockArray;
}

/**
 * Generates a random object that complies with schema.
 * @param {object} schema Specification of Object.
 * @param {string} jsonpath jsonpath of the Object.
 * @param {object} overrides Overridden Keys/fields with their values.
 * @return {object} Random Object.
 */
function getMockObject(schema, jsonpath, overrides = {}) {
  if (overridden(jsonpath, overrides)) {
    return JSONPath(jsonpath, overrides)[0];
  }
  const mockObject = {};
  const keys = Object.keys(schema.properties);
  keys.forEach(function(key) {
    const keySchema = schema.properties[key];
    mockObject[key] =
      getMockData(keySchema, `${jsonpath}.${key}`, overrides);
  });
  return mockObject;
}

/**
 * Generates a random data that complies with schema.<br>
 * Use case: generating random requestbody which complies with schema.
 * @param {object} schema Specification of data.
 * @param {string} jsonpath jsonpath of the Field/Key.
 * @param {object} overrides Overridden Keys/fields with their values.
 * @return {object} Random Object.
 */
function getMockData(schema, jsonpath, overrides = {}) {
  if (!schema) return undefined;

  if (overridden(jsonpath, overrides)) {
    return JSONPath(jsonpath, overrides)[0];
  }

  if (schema.oneOf) {
    const schemas = schema.oneOf;
    return getMockData(schemas[Math.floor(Math.random() * schemas.length)],
        jsonpath, overrides);
  }

  if (schema.enum) {
    const items = schema.enum;
    return items[Math.floor(Math.random() * items.length)];
  }

  switch (schema.type) {
    case DataType.BOOLEAN:
      return [true, false][Math.floor(Math.random() * 2)];
    case DataType.INTEGER:
      return getMockInteger(schema, jsonpath, overrides);
    case DataType.NUMBER:
      return getMockNumber(schema, jsonpath, overrides);
    case DataType.STRING:
      return getMockString(schema, jsonpath, overrides);
    case DataType.ARRAY:
      return getMockArray(schema, jsonpath, overrides);
    case DataType.OBJECT:
      return getMockObject(schema, jsonpath, overrides);
    default:
      logger.warn(buildError(Error.LIMITED_SUPPORT, null, jsonpath, {
        schemaType: schema.type,
        supportedTypes: 'boolean, integer, number, string, array, object',
      }));
      return null;
  }
}

/**
 * Generates a random header from the parameters provided.<br>
 * There are many types of parameters supported by OAS 3.0 .<br>
 * Example: query params, path params, header params, cookie params.<br>
 * The scope of the functionality is limited to generating only header params.
 * @param {array} parameters Parameter List.
 * @param {object} overrides Keys/fields of request headers and their
 *  overridden values.
 * @return {object} Mock Headers.
 */
function getMockHeaders(parameters, overrides = {}) {
  const mockHeaders = {};
  parameters = parameters || [];
  parameters.forEach(function(parameter) {
    if (parameter.in === 'header') {
      mockHeaders[parameter.name] = getMockData(parameter.schema,
          `$.${parameter.name}`, overrides);
    }
  });
  return mockHeaders;
}

module.exports = {
  getMockHeaders,
  getMockData,
};
