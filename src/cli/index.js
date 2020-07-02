#!/usr/bin/env node

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

const {program} = require('commander');
const {
  generateTestSuite,
  validateApiEndpoints,
} = require('./actions');

const manifest = require('../../package.json');
program
    .version(manifest.version ? manifest.version : 'unknown',
        '-v, --version',
        'outputs the version of ats');

program
    .name('ats')
    .usage('<command> [options]');

program
    .command('generate')
    .description('generates testsuite for the given oas document')
    .option('--oaspath <oaspath>', 'oas document path')
    .option(
        '--testsuitepath <testsuitepath>',
        'path where the generated testsuite is saved',
    )
    .option('--verbose', `logs above and equal to 'verbose' level are logged`)
    .action(generateTestSuite);

program
    .command('validate')
    .description('validates apis against a testsuite')
    .option(
        '--testsuitepath <testsuitepath>',
        'testsuite file will be uploaded from testsuitepath',
    )
    .option('--oaspath <oaspath>', 'oas document path')
    .option('--baseURL <baseURL>', 'baseURL of the api endpoints')
    .option(
        '--apiendpoints <apiendpoints>',
        'list of api endpoints which needs to be tested',
    )
    .option('--apikeys <apikeys>', 'API keys')
    .option('--basicauth <basicauth>', 'Basic Auth Credentials')
    .option(
        '--saveconfigto <configpath>',
        'upserts the config to the file present in configpath',
    )
    .option(
        '--uploadconfigfrom <configpath>',
        'uploads the config from the file present in configpath',
    )
    .option('--timeout <timeout>', 'maximum request-duration')
    .option('--verbose', 'provides extensive information through extra logs')
    .action(validateApiEndpoints);

// eslint-disable-next-line no-undef
program.parse(process.argv);
