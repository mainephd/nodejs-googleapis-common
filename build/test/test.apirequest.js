"use strict";
// Copyright 2018, Google, LLC.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const nock = require("nock");
const apirequest_1 = require("../src/apirequest");
nock.disableNetConnect();
const fakeContext = {
    _options: {}
};
const url = 'https://example.com';
const fakeResponse = '👻';
afterEach(() => {
    nock.cleanAll();
});
/**
 * As of today, most of the tests that cover this module live in
 * google-api-nodejs-client.  We need to slowly cover each scenario,
 * and bring this up to 100%.  This is just a simple starter.
 */
it('should create a valid API request', () => __awaiter(this, void 0, void 0, function* () {
    const scope = nock(url).get('/').reply(200, fakeResponse);
    const result = yield apirequest_1.createAPIRequest({
        options: { url },
        params: {},
        requiredParams: [],
        pathParams: [],
        context: fakeContext
    });
    scope.done();
    assert.strictEqual(result.data, fakeResponse);
    assert(result);
}));
//# sourceMappingURL=test.apirequest.js.map