const RandExp = require('randexp');
const faker = require('faker');
const {logger} = require('./Logger');
const {
  getRandomNumber,
  getRandomString,
  getJsonFieldsAtLevel,
} = require('./Util');

function getMockInteger(schema) {
  const low = schema.minimum;
  const high = schema.maximum;
  return getRandomNumber(low, high, {returnInteger: true});
}

// Number Datatype supports both integer and float values.
function getMockNumber(schema) {
  const low = schema.minimum;
  const high = schema.maximum;
  return getRandomNumber(low, high);
}

function getMockString(schema, identifier) {
  // No support for combined conditions.
  // Include the priority list of keywords in jsDoc.
  if (schema.format) {
    switch (schema.format) {
      case 'email': {
        const randomEmail = faker.internet.email();
        return randomEmail;
      }
      case 'uuid': {
        const randomUUID = faker.random.uuid();
        return randomUUID;
      }
      case 'uri': {
        const randomURI = faker.internet.url();
        return randomURI;
      }
      case 'ipv4': {
        const randomIPv4 = faker.internet.ip();
        return randomIPv4;
      }
      case 'ipv6': {
        const randomIPv6 = faker.internet.ipv6();
        return randomIPv6;
      }
      default: {
        const errorInfo = {
          errorType: 'Limited Support Error',
          errorDetails: {
            key: identifier,
            format: schema.format,
            supportedFormats: 'email, uuid, uri, ipv4/ipv6',
          },
        };
        logger['info'](errorInfo);
        return '';
      }
    }
  }

  if (schema.pattern) {
    try {
      const regex = new RegExp(schema.pattern);
      return new RandExp(regex).gen();
    } catch (err) {
      logger['info'](`Invalid Schema Pattern - ${schema.pattern}`);
      logger['error'](err);
      return '';
    }
  }

  const low = schema.minLength || 1;
  const high = schema.maxLength || low + 10;
  // Constants like 10 has to be moved into Constants Folder.

  const lengthOfString = getRandomNumber(low, high, {returnInteger: true});
  return getRandomString(lengthOfString);
}

function getMockArray(schema, identifier) {
  // We don't support any-type array.
  const mockArray = [];
  const lengthOfMockArray = getRandomNumber(1, 10, {returnInteger: true});
  // Constanats have to be moved to CONSTANTS file.

  for (let index = 0; index < lengthOfMockArray; index++) {
    mockArray.push(getMockData(schema.items, identifier));
  }
  return mockArray;
}


function getMockObject(schema, identifier) {
  const mockObject = {};
  const keys = getJsonFieldsAtLevel(schema.properties, 1);
  keys.forEach(function(key) {
    const keySchema = schema.properties[key];
    mockObject[key] =
      getMockData(keySchema, identifier + '.' + key);
  });
  return mockObject;
}


function getMockData(schema, identifier = '$') {
  if (!schema) return undefined;

  if (schema.oneOf) {
    const schemas = schema.oneOf;
    return getMockData(
        schemas[Math.floor(Math.random() * schemas.length)], identifier);
  }

  if (schema.enum) {
    const items = schema.enum;
    return items[Math.floor(Math.random() * items.length)];
  }

  switch (schema.type) {
    case 'boolean':
      return [true, false][Math.floor(Math.random() * 2)];
    case 'integer':
      return getMockInteger(schema, identifier);
    case 'number':
      return getMockNumber(schema, identifier);
    case 'string':
      return getMockString(schema, identifier);
    case 'array':
      return getMockArray(schema, identifier);
    case 'object':
      return getMockObject(schema, identifier);
    default:
      logger['error'](`No support for ${schema.type}`);
      return;
  }
}

function getMockHeaders(parameters) {
  const mockHeaders = {};
  parameters = parameters || [];
  parameters.forEach(function(parameter) {
    if (parameter.in === 'header') {
      mockHeaders[parameter['name']] = getMockData(parameter['schema']);
    }
  });
  return mockHeaders;
}

function getMockRequestBody(schema) {
  return getMockData(schema);
}

module.exports = {
  getMockHeaders,
  getMockRequestBody,
  getMockData,
};
