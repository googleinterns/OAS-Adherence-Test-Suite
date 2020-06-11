// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const readlineSync = require('readline-sync');
const jsonFieldsAtLevel = require('../../utils/jsonFieldsAtLevel');

function getApiKeyFromUser(apiKey) {
  const response = readlineSync.question(`\n[API_KEY]  ${apiKey}:  `.grey);
  return response;
}


function getApiKeyList(apiSpec, securitySchemes) {
  const apiSecuritySchemes = apiSpec.security || [];
  const apiKeyList = [];
  apiSecuritySchemes.forEach(function(apiSecurityScheme) {
    const key = jsonFieldsAtLevel(apiSecurityScheme, 1)[0];
    if (securitySchemes[key].type === 'apiKey') {
      // console.log('Insert', key);
      apiKeyList.push(key);
    }
  });
  return apiKeyList;
}

function isBasicAuthRequired(apiSpec, securitySchemes) {
  const apiSecuritySchemes = apiSpec.security || [];
  let isRequired = false;

  apiSecuritySchemes.forEach(function(apiSecurityScheme) {
    const key = jsonFieldsAtLevel(apiSecurityScheme, 1)[0];
    if (securitySchemes[key].type === 'http' &&
        securitySchemes[key].scheme === 'basic') {
      isRequired = true;
    }
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
  // eslint-disable-next-line no-constant-condition
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

  // return 'Basic ' + Buffer.from(userName + ':' +password).toString('base64');
  // Return base64 Encoded String.
  return 'Basic ' + btoa(userName + ':' + password);
}


module.exports = {
  getApiKeyFromUser,
  getApiKeyList,
  getBasicAuthCredentialsFromUser,
  isBasicAuthRequired,
};


