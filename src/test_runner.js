const axios = require('axios');
const colors = require('colors');
const equals = require('is-equal-shallow');
const {validateDataAgainstSchema} = require('./validator');

function runTestSuite() {
  const {testParams} = require('./test_setup');
  const {
    apiEndpointsToTest,
    testSuiteFile,
    basicAuthCredentials,
    apiKeys,
  } = testParams;
  const oasDoc = testSuiteFile.oasDoc;
  const apiTestSuites = testSuiteFile.apiTestSuites;

  /*
    [DEV] Need Test cases for validation of security requirements of
    an apiEndpoint.
    Example: An api which requires API key to be passed shouldn't return a
    2xx http status code when the API key is not passed.
  */

  apiTestSuites.forEach(async function(apiTestSuite) {
    const {apiEndpoint} = apiTestSuite;

    // Check if the apiEndpoint is being asked to test by the user.
    const toBeTested = apiEndpointsToTest.some(function(apiEndpointToTest) {
      return equals(apiEndpoint, apiEndpointToTest);
    });
    if (!toBeTested) return;

    const {
      path,
      httpMethod,
    } = apiEndpoint;
    const url = 'https://petstore.swagger.io/v2' + apiEndpoint.path;
    const exampleRequestBody = apiTestSuite.examples.requestBody;
    const exampleRequestHeaders = apiTestSuite.examples.requestHeaders;
    const apiResponseSchemas = oasDoc.paths[path][httpMethod].responses;

    const positiveTestCases = apiTestSuite.tests.positiveTests;
    const negativeTestCases = apiTestSuite.tests.negativeTests;
    /*
      [DEV] Should be made generic to execute both
      positiveTestCases and negativeTestCases.
    */
    for (const testCase of negativeTestCases) {
      let requestBody;
      let requestHeaders;
      if (testCase.testForRequestBody) {
        requestBody = testCase.data;
        requestHeaders = exampleRequestHeaders;
      } else if (testCase.testForRequestHeaders) {
        requestHeaders = testCase.data;
        requestBody = exampleRequestBody;
      }

      /*
        Append the apikeys or basic auth credentials required
        to the request header.
      */
      let responseStatusCode;
      let responseBody;
      let responseHeaders;
      try {
        const response = await axios({
          url,
          method: httpMethod,
          headers: requestHeaders,
          data: requestBody,
        });
        responseStatusCode = response.status;
        responseBody = response.data;
        responseHeaders = response.headers;
      } catch (error) {
        responseStatusCode = error.response.status;
      }

      const initialTestVerdict =
        (responseStatusCode/100 !== 2) ? 'pass': 'fail';

      /*
        Filter out unnecessary data from the testcase ,
        in order to present the necessary details to the user.
      */
      delete testCase.data;
      delete testCase.testForRequestBody;

      const testLog = `Test Run for ${httpMethod} ${url}.\n` +
        `Test Case Details [${JSON.stringify(testCase)}]\n` +
        `Expected http Status code 4xx 5xx.\n` +
        `Received http status code ${responseStatusCode}`;


      /*
        finalTestVerdict takes care of the validation of responseBody and
        responseHeaders against the schema.
      */
      let finalTestVerdict = 'pass';
      let responseBodyErrors = [];
      let responseHeaderErrors = [];

      if (initialTestVerdict === 'pass') {
        console.log(`${testLog}`.green.bold);

        /*
          Validate the response body against the schema
          if provided in the oasDoc.
        */
        try {
          const responseSchemaOfStatusCode =
            apiResponseSchemas[responseStatusCode];
          const responseBodySchema =
            responseSchemaOfStatusCode.content['application/json'].schema;

          responseBodyErrors = responseBodyErrors.concat(
              validateDataAgainstSchema(responseBody, responseBodySchema));
          if (responseBodyErrors.length) finalTestVerdict = 'fail';
        } catch (err) {
          /*
            skip validation, as there is no schema provided in oasDoc for
            response body of the received http status code in JSON format.
          */
          console.log('Skipped Validation for responseBody'.yellow.bold);
        }

        /*
          Validate the response headers against the schema
          if provided in the oasDoc.
        */
        try {
          const responseSchemaOfStatusCode =
            apiResponseSchemas[responseStatusCode];
          const responseHeaderSchema =
            responseSchemaOfStatusCode.headers;
          const keys = Object.keys(responseHeaderSchema);
          keys.forEach(function(key) {
            responseHeaderErrors =
              responseHeaderErrors.concat(
                  validateDataAgainstSchema(
                      responseHeaders[key],
                      responseHeaderSchema[key]));
          });
          if (responseHeaderErrors.length) finalTestVerdict = 'fail';
        } catch (err) {
          /*
            skip validation, as there is no schema provided in oasDoc for
            response headers of the received http status code in JSON format.
          */
          console.log('Skipped Validation for responseHeaders'.yellow.bold);
        }
      } else {
        console.log(`${testLog}`.red.bold);
      }

      if (finalTestVerdict === 'fail') {
        if (responseHeaderErrors.length) {
          console.log('Error Details of responseHeaders'.yellow.bold);
          console.log(`${JSON.stringify(responseHeaderErrors)}`.magenta);
        }

        if (responseBodyErrors.length) {
          console.log('Error Details of responseBody'.yellow.bold);
          console.log(`${JSON.stringify(responseBodyErrors)}`.magenta);
        }
      }
      console.log('\n\n');
    }
  });
}

module.exports = {
  runTestSuite,
};
