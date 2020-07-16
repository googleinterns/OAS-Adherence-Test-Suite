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
const Schemas = {
  ARRAY: {
    type: 'array',
    items: {
      type: 'number',
      minimum: 123,
      maximum: 456,
    },
  },
  ONEOF: {
    type: 'object',
    oneOf: [
      {
        type: 'object',
        properties: {
          bark: {
            type: 'string',
          },
          breed: {
            type: 'string',
            enum: ['Dingo', 'Husky'],
          },
        },
      },
      {
        type: 'object',
        properties: {
          bark: {
            'type': 'string',
          },
          hunts: {
            type: 'boolean',
          },
          age: {
            type: 'integer',
          },
        },
      },
    ],
  },
  REQUIRED: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
      },
      username: {
        type: 'string',
      },
    },
    required: ['id'],
  },
  FORMAT: {
    type: 'object',
    properties: {
      firstname: {
        type: 'string',
        format: 'email',
      },
      secondname: {
        type: 'string',
        format: 'uuid',
      },
      thirdname: {
        type: 'string',
        format: 'uri',
      },
      fourthname: {
        type: 'string',
        format: 'ipv4',
      },
      lastname: {
        type: 'string',
        format: 'ipv6',
      },
    },
  },
  SIMPLE: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        format: 'int64',
        minimum: 100,
      },
      petId: {
        type: 'integer',
        format: 'int64',
        maximum: 100,
      },
      quantity: {
        type: 'integer',
        format: 'int32',
        minimum: 100,
        maximum: 150,
      },
      shipDate: {
        type: 'string',
        pattern: '^\\d{3}-\\d{2}-\\d{4}$',
      },
      shipDate2: {
        type: 'string',
        minLength: 10,
        maxLength: 20,
        format: 'ipv6',
      },
      status: {
        type: 'string',
        description: 'Order Status',
        enum: ['placed', 'approved', 'delivered'],
      },
      statusDup: {
        type: 'string',
        description: 'Order Status',
        enum: ['placed', 'approved', 'delivered'],
      },
      complete: {
        type: 'boolean',
      },
    },
    required: ['status', 'complete'],
  },
  COMPLEX: {
    type: 'object',
    properties: {
      recObject: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
            minimum: 100,
            maximum: 150,
          },
          petId: {
            type: 'integer',
            format: 'int64',
          },
          quantity: {
            type: 'integer',
            format: 'int32',
          },
          shipDate: {
            type: 'string',
            minLength: 10,
            maxLength: 20,
          },
          status: {
            type: 'string',
            description: 'Order Status',
            enum: [
              'placed',
              'approved',
              'delivered',
            ],
          },
          complete: {
            'type': 'boolean',
          },
        },
        required: [
          'status',
          'complete',
        ],
      },
      id: {
        type: 'integer',
        format: 'int64',
      },
      petId: {
        type: 'integer',
        format: 'int64',
      },
      height: {
        type: 'number',
        minimum: 1.25,
        maximum: 9.00,
      },
      quantity: {
        type: 'integer',
        format: 'int32',
        minimum: 100,
        maximum: 150,
      },
      shipDate: {
        type: 'string',
        minLength: 10,
      },
      status: {
        type: 'string',
        description: 'Order Status',
        enum: [
          'placed',
          'approved',
          'delivered',
        ],
      },
      complete: {
        type: 'boolean',
      },
      reviews: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Order Status',
              enum: [
                'placed',
                'approved',
                'delivered',
              ],
            },
            complete: {
              type: 'boolean',
            },
            name: {
              type: 'string',
              minLength: 10,
              maxLength: 15,
            },
            age: {
              type: 'integer',
              minimum: 18,
              maximum: 64,
            },
          },
          required: [
            'status',
            'complete',
          ],
        },
      },
      master: {
        type: 'object',
        properties: {
          bark: {
            type: 'boolean',
          },
        },
      },
    },
    required: [
      'status',
      'complete',
    ],
  },
  PARAMETERS: [
    {
      name: 'api_key',
      in: 'header',
      schema: {
        type: 'string',
      },
    },
  ],
};

module.exports = {Schemas};
