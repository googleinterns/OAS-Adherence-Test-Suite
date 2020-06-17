/* eslint-disable no-undef */
const chai = require('chai');
const assert = chai.assert;
let oasDoc = require('../../examples/oas/petstore_oas3.json');
const {generateTestSuiteFile} = require('../../src/datagen/test_datagen');
const {parseOASDoc} = require('../../src/apiutils');

describe.only('test_datagen.js', async function() {
  oasDoc = await parseOASDoc(oasDoc);
  generateTestSuiteFile(oasDoc);
});
