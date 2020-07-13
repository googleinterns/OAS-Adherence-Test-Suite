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
/* eslint-disable no-undef */
const chai = require('chai');
const assert = chai.assert;
const {Schemas} = require('../examples/schemas');
const {validateDataAgainstSchema} = require('../src/validator');

const positiveTestcases = [
  {
    data: 'Dingo',
    schema: {'type': 'string', 'enum': ['Dingo', 'Husky']},
  },
  {
    data: true,
    schema: {'type': 'boolean'},
  },
  {
    data: 3.50,
    schema: {type: 'number', minimum: 1.05, maximum: 4.65},
  },
  {
    data: 3,
    schema: {type: 'integer', minimum: 1, maximum: 4},
  },
  {
    data: [123, 400, 456],
    schema: Schemas.ARRAY,
  },
  {
    data: 'abilash@gmail.com',
    schema: {'type': 'string', 'format': 'email'},
  },
  {
    data: '43c13c2e-c3d6-11ea-87d0-0242ac130003',
    schema: {'type': 'string', 'format': 'uuid'},
  },
  {
    data: 'www.guru99.com',
    schema: {'type': 'string', 'format': 'uri'},
  },
  {
    data: '69.89.31.226',
    schema: {'type': 'string', 'format': 'ipv4'},
  },
  {
    data: '2002:4559:1FE2::4559:1FE2',
    schema: {'type': 'string', 'format': 'ipv6'},
  },
  {
    data: '123-12-1234',
    schema: {'type': 'string', 'pattern': '(\\d{3}-\\d{2}-\\d{4})$'},
  },
  {
    data: 'abilash',
    schema: {'type': 'string', 'minLength': 5, 'maxLength': 9},
  },
  {
    data: {'id': 123},
    schema: Schemas.REQUIRED,
  },
  {
    data: [1, [3]],
    schema: {type: 'multidimensional-array'},
  },
  {
    data: {'bark': 'yes', 'breed': 'Husky'},
    schema: Schemas.ONEOF,
  },
];

const negativeTestcases = [
  {
    data: null,
    schema: {'type': 'boolean'},
  },
  {
    data: 'true',
    schema: {'type': 'boolean'},
  },
  {
    data: {},
    schema: {'type': 'array'},
  },
  {
    data: 1.50,
    schema: {'type': 'integer'},
  },
  {
    data: '1.s5',
    schema: {'type': 'number'},
  },
  {
    data: [1, 2, 3],
    schema: {'type': 'string'},
  },
  {
    data: '[1, 2, 3]',
    schema: {'type': 'object'},
  },
  {
    data: 'Dino',
    schema: {'type': 'string', 'enum': ['Dingo', 'Husky']},
  },
  {
    data: 'TRUE',
    schema: {'type': 'boolean'},
  },
  {
    data: 5.005,
    schema: {type: 'number', minimum: 1.05, maximum: 4.90},
  },
  {
    data: 9,
    schema: {type: 'integer', minimum: 1, maximum: 4},
  },
  {
    data: [123, 500, 456],
    schema: Schemas.ARRAY,
  },
  {
    data: 'abilashgmail.com',
    schema: {'type': 'string', 'format': 'email'},
  },
  {
    data: '43c13c2ec3d6-11ea-87d0-0242ac130003',
    schema: {'type': 'string', 'format': 'uuid'},
  },
  {
    data: 'wwwguru99com',
    schema: {'type': 'string', 'format': 'uri'},
  },
  {
    data: '69.8901226',
    schema: {'type': 'string', 'format': 'ipv4'},
  },
  {
    data: '2002:454559:1FE2::4559:1FE2',
    schema: {'type': 'string', 'format': 'ipv6'},
  },
  {
    data: '9876543210',
    schema: {'type': 'string', 'format': 'phone'},
  },
  {
    data: '123--12-1234',
    schema: {'type': 'string', 'pattern': '(\\d{3}-\\d{2}-\\d{4})$'},
  },
  {
    data: '[',
    schema: {'type': 'string', 'pattern': '['},
  },
  {
    data: 'abilash',
    schema: {'type': 'string', 'minLength': 5, 'maxLength': 6},
  },
  {
    data: {'username': 'gabil'},
    schema: Schemas.REQUIRED,
  },
  {
    data: {'bark': true, 'breed': 'Husky'},
    schema: Schemas.ONEOF,
  },
];

describe('validator.js', function() {
  describe('validateDataAgainstSchema()', function() {
    it('should not produce errors when data complies with the schema',
        function() {
          positiveTestcases.forEach(function(positiveTestcase) {
            const {data, schema} = positiveTestcase;
            const errors = validateDataAgainstSchema(data, schema, '$');
            assert.isEmpty(errors);
          });
        });
    it('should produce errors when data doesnt comply with the schema',
        function() {
          negativeTestcases.forEach(function(negativeTestcase) {
            const {data, schema} = negativeTestcase;
            const errors = validateDataAgainstSchema(data, schema, '$');
            assert.isNotEmpty(errors);
          });
        });
  });
});
