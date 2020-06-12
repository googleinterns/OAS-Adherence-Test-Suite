/* eslint-disable no-unused-vars */
const {logger} = require('./source/Logger');

/*
// ---------------------------- Util.js-----------------------------------------
const {
  getRandomNumber,
  getRandomString,
  getJsonFieldsAtLevel,
} = require('./source/Util');

// [DEV]Develop getArgumentSuite.

const argumentSuite = [
  [undefined, undefined, undefined],
  [undefined, undefined, {returnInteger: true}],
  [undefined, 10, undefined],
  [undefined, 10, {returnInteger: true}],
  [10, undefined, undefined],
  [10, undefined, {returnInteger: true}],
  [1, 10, undefined],
  [1, 10, {returnInteger: true}],
];
argumentSuite.forEach(function(argumentSet) {
  console.log(getRandomNumber(argumentSet[0], argumentSet[1], argumentSet[2]));
});


console.log(getRandomString());


const obj = {
  'fname': 'Abilash',
  'lname': 'G',
  'phone': [1, 2, 3],
  'age': 10,
  'address': {
    'homeAddress': 'Salem',
    'corporateAddress': 'Bangalore',
  },
};
for (let depth = 0; depth < 3; depth++) {
  console.log(getJsonFieldsAtLevel(obj, depth));
}

*/


/*
// ----------------------------- Security.js -----------------------------------

const oasDoc = require('./oas3-docholder/petstore.json');

const {
  getApiKeyFromUser,
  getApiKeyListForChosenApiEndPoints,
  getBasicAuthCredentialsFromUser,
  isBasicAuthRequiredForChosenApiEndPoints,
} = require('./source/Security');


getApiKeyFromUser('X-CSRF_TOKEN');
const apiEndPoints = [
  {
    path: '/pet',
    httpMethod: 'put',
  },
  {
    path: '/store/inventory',
    httpMethod: 'get',
  },
];
const apiKeyList = getApiKeyListForChosenApiEndPoints(apiEndPoints, oasDoc);
console.log(apiKeyList);
console.log(isBasicAuthRequiredForChosenApiEndPoints(apiEndPoints, oasDoc));
console.log(getBasicAuthCredentialsFromUser());
*/


/*
// ------------------   MockDataGenerator.js   &&   Validators.js  -------------

const {
  getMockHeaders,
  getMockRequestBody,
} = require('./source/MockDataGenerator');

// const simpleSchema =
//   require('./developmentresource/datastore/simpleschema.json');
// const complexSchema =
//   require('./developmentresource/datastore/complexschema.json');

// const mockData1 = getMockRequestBody(simpleSchema);
// const mockData2 = getMockRequestBody(complexSchema);

// const schema3 =
//   require('./developmentresource/datastore/apischemawith-arrayfield.json');
// logger.info(getMockRequestBody(schema3));

// [DEV] has to check for OneOf.

const schema4 =
  require('./developmentresource/datastore/apischemawith-requiredfield.json');
console.log(getMockRequestBody(schema4));


const {
  validateDataAgainstSchema,
} = require('./source/Validator');

// mockData1.complete = 5;
// mockData1.id = 'foo';
// mockData1.extraKey = 'extraValue';
// console.log(mockData1);
// const mockData2 = getMockRequestBody(complexSchema);
// console.log(validateDataAgainstSchema(mockData1, simpleSchema));

// console.log(mockData2);
// mockData2.recObject.id = 'foo';
// console.log(validateDataAgainstSchema(mockData2, complexSchema));


// const randomData = getMockRequestBody(schema4);
// delete randomData.id;
// delete randomData.username;
// console.log(randomData);
// logger.info(validateDataAgainstSchema(randomData, schema4));
*/


