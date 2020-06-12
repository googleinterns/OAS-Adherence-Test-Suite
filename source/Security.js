/* eslint-disable no-constant-condition */
// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const btoa = require('btoa');
const readlineSync = require('readline-sync');
const {getJsonFieldsAtLevel} = require('./Util');

function getApiKeyFromUser(apiKey) {
  const response = readlineSync.question(`\n[API_KEY]  ${apiKey}:  `.grey);
  return response;
}


function getApiKeyListForChosenApiEndPoints(apiEndPoints, oasDoc) {
  const globalSecuritySchemes = oasDoc.components.securitySchemes || {};
  const apiKeyList = [];

  apiEndPoints.forEach(function(apiEndPoint) {
    const securitySchemes =
      oasDoc.paths[apiEndPoint.path][apiEndPoint.httpMethod].security || [];

    securitySchemes.forEach(function(securityScheme) {
      const securityKey = getJsonFieldsAtLevel(securityScheme, 1)[0];
      if (globalSecuritySchemes[securityKey].type === 'apiKey') {
        apiKeyList.push(securityKey);
      }
    });
  });
  return apiKeyList;
}


function isBasicAuthRequiredForChosenApiEndPoints(apiEndPoints, oasDoc) {
  const globalSecuritySchemes = oasDoc.components.securitySchemes || {};
  let isRequired = false;

  apiEndPoints.forEach(function(apiEndPoint) {
    const securitySchemes =
      oasDoc.paths[apiEndPoint.path][apiEndPoint.httpMethod].security || [];

    securitySchemes.forEach(function(securityScheme) {
      const securityKey = getJsonFieldsAtLevel(securityScheme, 1)[0];
      if (globalSecuritySchemes[securityKey].type === 'http' &&
        globalSecuritySchemes[securityKey].scheme === 'basic') {
        isRequired = true;
      }
    });
  });
  return isRequired;
}


function getBasicAuthCredentialsFromUser() {
  console.log('Provide basic credentials for Authentication.' +
    '(UserName, Password)');
  console.log('Tip: Please fill in the details properly.' +
    'TestCases can fail if proper Authentication Credentials are not given.');

  const userName = readlineSync.question('UserName:  ');
  let password;
  let confirmPassword;
  while (true) {
    password = readlineSync.question('Password:  ', {hideEchoBack: true});
    confirmPassword =
      readlineSync.question('Confirm Password:  ', {hideEchoBack: true});
    if (password !== confirmPassword) {
      console.log('Password - Confirm Password Mismatch.');
      console.log('Please Enter the details again.');
      continue;
    }
    break;
  }

  // Return base64 Encoded String.
  return 'Basic ' + btoa(userName + ':' + password);
}


module.exports = {
  getApiKeyFromUser,
  getApiKeyListForChosenApiEndPoints,
  getBasicAuthCredentialsFromUser,
  isBasicAuthRequiredForChosenApiEndPoints,
};

