
// function getBasicAuthCredentialsFromUser() {
//   console.log('Provide basic credentials for Authentication.' +
//     '(UserName, Password)');
//   console.log('Tip: Please fill in the details properly.' +
//     'TestCases can fail if proper Authentication Credentials are not given.');

//   const userName = readlineSync.question('UserName:  ');
//   let password;
//   let confirmPassword;
//   while (true) {
//     password = readlineSync.question('Password:  ', {hideEchoBack: true});
//     confirmPassword =
//       readlineSync.question('Confirm Password:  ', {hideEchoBack: true});
//     if (password !== confirmPassword) {
//       console.log('Password - Confirm Password Mismatch.');
//       console.log('Please Enter the details again.');
//       continue;
//     }
//     break;
//   }

//   // Return base64 Encoded String.
//   return 'Basic ' + btoa(userName + ':' + password);
// }


// /**
//  * Take apikey from user.
//  * @param {string} apiKey Name of apiKey.
//  * @return {string} Value of apiKey.
//  */
// function getApiKeyFromUser(apiKey) {
//   const response = readlineSync.question(`\n[API_KEY]  ${apiKey}:  `.grey);
//   return response;
// }