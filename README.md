**This is not an officially supported Google product.**

# OAS Adherence Test Suite

OAS Adherence Test Suite will allow a user to test whether an API is correctly
implemented as per a defined OpenAPI Specification. The intention is to call
and implemented API and validate basic assumptions and requirements such as

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

Further details on running instructions and deployment details will be added as
the project evolves.

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
