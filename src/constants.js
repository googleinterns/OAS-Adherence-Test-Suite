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

/** @module constants */
/** @fileoverview Contains constants which are used through out the code.*/

/**
 * String formats supported.<br>
 * "schema.format" is used for specifying a string's format in OAS 3.0 Doc.
 * @enum {string}
*/
const SchemaFormat = {
  EMAIL: 'email',
  UUID: 'uuid',
  URI: 'uri',
  IPV4: 'ipv4',
  IPV6: 'ipv6',
};

/**
 * Data Types supported.<br>
 * "schema.type" is used for specifying the data type in OAS 3.0 Doc.
 * @enum {string}
*/
const DataType = {
  INTEGER: 'integer',
  NUMBER: 'number',
  STRING: 'string',
  ARRAY: 'array',
  OBJECT: 'object',
  BOOLEAN: 'boolean',
};

const Error = {
  DATA_TYPE: 'Data Type Mismatch Error',
  OUT_OF_RANGE: 'Out of Range Error',
  REQUIRED_KEY: 'Required Key Missing Error',
  LIMITED_SUPPORT: 'Limited Support Error',
  ENUM: 'Enum Error',
  ONE_OF: 'OneOf Error',
  DATA_LACK: 'Lack of Data Error',
  FORMAT: 'String Format Error',
  PATTERN: 'String Pattern Error',
  OAS_DOC: 'OAS 3.0 Document Error',
};

module.exports = {
  SchemaFormat,
  DataType,
  Error,
};
