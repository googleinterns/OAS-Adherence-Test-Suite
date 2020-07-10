**This is not an officially supported Google product.**

# OAS Adherence Test Suite

OAS Adherence Test Suite will allow a user to test whether an API is correctly
implemented as per a defined OpenAPI Specification. The intention is to call
an implemented API and validate basic assumptions and requirements such as

- Resources
- Data Types
- Enumerations
- Required / Optional fields
- Error Responses

We will add more as we build and develop this project.

**Note**: This is not meant to be a functional test suite. It cannot make
semantically correct calls and cannot also chain calls. It's only purpose is
to give the API Spec creator or consumer the confidence that the API is
implemented correctly as per the spec and is ready to consume without fear
of mismatched expectations of request / response.

The aim is that this project will reduce manual reviews of OpenAPI Spec
implementations and faster development as well as time to integration.

This template uses the Apache license, as is Google's default. See the
documentation for instructions on using alternate license.


## How to use

The project will run on Node.js and is intended to be used from the
command-line or with a light-weight UI wrapper to provide a better
user experience.

## Commands
> #### Note: App can serve the users through interative cli as well. Users will be asked/prompted for necessary data if not provided through command options. Also, users can just type    ```ats <command>``` to start a complete interactive cli flow. 

### Generate testsuite 
> Generates testsuite containing testcases for all the api endpoints present in the OAS 3.0 document.
```bash
ats generate [--oaspath <oaspath>] [--testsuitepath <testsuitepath>] [--overridespath <overridespath>] [--verbose]
```
#### Options
* ```--oaspath <oaspath>```: Path of OAS 3.0 document.
* ```--testsuitepath <testsuitepath>```: Path where the generated testsuite is saved.
* ```--overridespath <overridespath>```: Path of Overrides file.
* ```--verbose```: Provides more information about events that occur through logs.
#### Examples
* ```--oaspath= "/foldername/petstore.json" ```
* ```--testsuitepath= "/foldername/petstore_1.0.5_testsuite.json" ```
* ```--overridespath= "/ats/overrides.json" ```
* ```--verbose ```

### Validate API Endpoints
> Validates the API Endpoints against the OpenAPI Specification.
```bash
ats validate [--testsuitepath <testsuitepath>] [--oaspath <oaspath>] [--overridespath <overridespath>]
[--baseURL <baseURL>] [--apiendpoints <apiendpoints>] [--apikeys <apikeys>] [--basicauth <basicauth>] 
[--saveconfigto <configpath>] [--uploadconfigfrom <configpath>] [--timeout <timeout>] [--verbose]
```
#### Options
* ```--testsuitepath <testsuitepath>```: Path of testsuite. (App runs testcases present in the testsuite)
* ```--oaspath <oaspath>```: Path of OAS 3.0 document. (App runs testcases which are generated against the provided OAS 3.0 document)
* ```--overridespath <overridespath>```: Path of Overrides file.
* ```--baseURL <baseURL>```: BaseURL
* ```--apiendpoints <apiendpoints>```: API Endpoints that needs to be validated.
* ```--apikeys <apikeys>```: API Keys used for Authentication/Authorisation.
* ```--basicauth <basicauth>```: Basic Authentication Credentials (username, password).
* ```--saveconfigto <configpath>```: Updates/Creates a config file with config object in configpath.
* ```--uploadconfigfrom <configpath>```: Reads the config object from the config file present in the configpath. 
* ```--timeout <timeout>```: Specifies the number of milliseconds before the request times out. (Default: 5000 ms)
* ```--verbose```: Provides more descriptive test results and information about events that occur through logs.
#### Examples
* ```--testsuitepath= "/foldername/petstore_1.0.5_testsuite.json" ```
* ```--oaspath= "/foldername/petstore.json" ```
* ```--overridespath= "/ats/overrides.json" ```
* ```--baseURL= "http://www.ats.com" ```
* ```--apiendpoints= '[{"path": "/pet", "httpMethod": "post"} , {"path": "/store", "httpMethod": "post"}]'```
* ```--apikeys= '[{"name": "X-API-KEY", "value":"foo"}, {"name": "X-API-KEY_DUP", "value": "bar"}]' ```
* ```--basicauth= '{"username": "sundar", "password": "sundar@123"}' ```
* ```--saveconfigto= "/foldername/petstore_config.json" ```
* ```--uploadconfigfrom= "/foldername/petstore_config.json" ```
* ```--timeout= 9000 ```
* ```--verbose ```

Further details on installation and basic requirement details will be added soon.

## Source Code Headers

Apache header:

    Copyright 2020 Google LLC

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        https://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
