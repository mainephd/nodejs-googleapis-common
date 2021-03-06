"use strict";
// Copyright 2014-2016, Google, Inc.
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
const google_auth_library_1 = require("google-auth-library");
const qs = require("qs");
const stream = require("stream");
const urlTemplate = require("url-template");
const uuid = require("uuid");
const maxContentLength = Math.pow(2, 31);
// tslint:disable-next-line no-var-requires
const pkg = require('../../package.json');
const USER_AGENT = `google-api-nodejs-client/${pkg.version} (gzip)`;
function isReadableStream(obj) {
    return obj instanceof stream.Readable && typeof obj._read === 'function';
}
function getMissingParams(params, required) {
    const missing = new Array();
    required.forEach(param => {
        // Is the required param in the params object?
        if (params[param] === undefined) {
            missing.push(param);
        }
    });
    // If there are any required params missing, return their names in array,
    // otherwise return null
    return missing.length > 0 ? missing : null;
}
function createAPIRequest(parameters, callback) {
    if (callback) {
        createAPIRequestAsync(parameters).then(r => callback(null, r), callback);
    }
    else {
        return createAPIRequestAsync(parameters);
    }
}
exports.createAPIRequest = createAPIRequest;
function createAPIRequestAsync(parameters) {
    return __awaiter(this, void 0, void 0, function* () {
        let params = parameters.params;
        const options = Object.assign({}, parameters.options);
        // Create a new params object so it can no longer be modified from outside
        // code Also support global and per-client params, but allow them to be
        // overriden per-request
        const topOptions = parameters.context.google ?
            parameters.context.google._options.params :
            {};
        params = Object.assign({}, // New base object
        topOptions, // Global params
        parameters.context._options.params, // Per-client params
        params // API call params
        );
        const media = params.media || {};
        /**
         * In a previous version of this API, the request body was stuffed in a field
         * named `resource`.  This caused lots of problems, because it's not uncommon
         * to have an actual named parameter required which is also named `resource`.
         * This mean that users would have to use `resource_` in those cases, which
         * pretty much nobody figures out on their own. The request body is now
         * documented as being in the `requestBody` property, but we also need to keep
         * using `resource` for reasons of back-compat. Cases that need to be covered
         * here:
         * - user provides just a `resource` with a request body
         * - user provides both a `resource` and a `resource_`
         * - user provides just a `requestBody`
         * - user provides both a `requestBody` and a `resource`
         */
        const resource = params.requestBody ? params.requestBody : params.resource;
        if (!params.requestBody && params.resource) {
            delete params.resource;
        }
        delete params.requestBody;
        let authClient = params.auth || parameters.context._options.auth ||
            (parameters.context.google ? parameters.context.google._options.auth :
                null);
        const defaultMime = typeof media.body === 'string' ?
            'text/plain' :
            'application/octet-stream';
        delete params.media;
        delete params.auth;
        // Grab headers from user provided options
        const headers = params.headers || {};
        delete params.headers;
        // Un-alias parameters that were modified due to conflicts with reserved names
        Object.keys(params).forEach(key => {
            if (key.slice(-1) === '_') {
                const newKey = key.slice(0, -1);
                params[newKey] = params[key];
                delete params[key];
            }
        });
        // Check for missing required parameters in the API request
        const missingParams = getMissingParams(params, parameters.requiredParams);
        if (missingParams) {
            // Some params are missing - stop further operations and inform the
            // developer which required params are not included in the request
            throw new Error('Missing required parameters: ' + missingParams.join(', '));
        }
        // Parse urls
        if (options.url) {
            options.url = urlTemplate.parse(options.url).expand(params);
        }
        if (parameters.mediaUrl) {
            parameters.mediaUrl = urlTemplate.parse(parameters.mediaUrl).expand(params);
        }
        // When forming the querystring, override the serializer so that array
        // values are serialized like this:
        // myParams: ['one', 'two'] ---> 'myParams=one&myParams=two'
        // This serializer also encodes spaces in the querystring as `%20`,
        // whereas the default serializer in axios encodes to a `+`.
        options.paramsSerializer = (params) => {
            return qs.stringify(params, { arrayFormat: 'repeat' });
        };
        // delete path parameters from the params object so they do not end up in
        // query
        parameters.pathParams.forEach(param => {
            delete params[param];
        });
        // if authClient is actually a string, use it as an API KEY
        if (typeof authClient === 'string') {
            params.key = params.key || authClient;
            authClient = undefined;
        }
        if (parameters.mediaUrl && media.body) {
            options.url = parameters.mediaUrl;
            if (resource) {
                // Axios doesn't support multipart/related uploads, so it has to
                // be implemented here.
                params.uploadType = 'multipart';
                const multipart = [
                    { 'Content-Type': 'application/json', body: JSON.stringify(resource) }, {
                        'Content-Type': media.mimeType || (resource && resource.mimeType) || defaultMime,
                        body: media.body // can be a readable stream or raw string!
                    }
                ];
                const boundary = uuid.v4();
                const finale = `--${boundary}--`;
                const rStream = new stream.PassThrough();
                const pStream = new ProgressStream();
                const isStream = isReadableStream(multipart[1].body);
                headers['Content-Type'] = `multipart/related; boundary=${boundary}`;
                for (const part of multipart) {
                    const preamble = `--${boundary}\r\nContent-Type: ${part['Content-Type']}\r\n\r\n`;
                    rStream.push(preamble);
                    if (typeof part.body === 'string') {
                        rStream.push(part.body);
                        rStream.push('\r\n');
                    }
                    else {
                        // Axios does not natively support onUploadProgress in node.js.
                        // Pipe through the pStream first to read the number of bytes read
                        // for the purpose of tracking progress.
                        pStream.on('progress', bytesRead => {
                            if (options.onUploadProgress) {
                                options.onUploadProgress({ bytesRead });
                            }
                        });
                        part.body.pipe(pStream).pipe(rStream, { end: false });
                        part.body.on('end', () => {
                            rStream.push('\r\n');
                            rStream.push(finale);
                            rStream.push(null);
                        });
                    }
                }
                if (!isStream) {
                    rStream.push(finale);
                    rStream.push(null);
                }
                options.data = rStream;
            }
            else {
                params.uploadType = 'media';
                Object.assign(headers, { 'Content-Type': media.mimeType || defaultMime });
                options.data = media.body;
            }
        }
        else {
            options.data = resource || undefined;
        }
        options.headers = headers;
        // options.method = options.method as Method;s
        options.params = params;
        // We need to set a default content size, or the max defaults
        // to 10MB.  Setting to 2GB by default.
        // https://github.com/google/google-api-nodejs-client/issues/991
        options.maxContentLength = options.maxContentLength || maxContentLength;
        options.headers['Accept-Encoding'] = 'gzip';
        options.headers['User-Agent'] = USER_AGENT;
        // By default Axios treats any 2xx as valid, and all non 2xx status
        // codes as errors.  This is a problem for HTTP 304s when used along
        // with an eTag.
        if (!options.validateStatus) {
            options.validateStatus = (status) => {
                return (status >= 200 && status < 300) || status === 304;
            };
        }
        // Combine the AxiosRequestConfig options passed with this specific
        // API call witht the global options configured at the API Context
        // level, or at the global level.
        const mergedOptions = Object.assign({}, (parameters.context.google ? parameters.context.google._options : {}), parameters.context._options, options);
        delete mergedOptions.auth; // is overridden by our auth code
        // Perform the HTTP request.  NOTE: this function used to return a
        // mikeal/request object. Since the transition to Axios, the method is
        // now void.  This may be a source of confusion for users upgrading from
        // version 24.0 -> 25.0 or up.
        if (authClient && typeof authClient === 'object') {
            return authClient.request(mergedOptions);
        }
        else {
            return (new google_auth_library_1.DefaultTransporter()).request(mergedOptions);
        }
    });
}
/**
 * Basic Passthrough Stream that records the number of bytes read
 * every time the cursor is moved.
 */
class ProgressStream extends stream.Transform {
    constructor() {
        super(...arguments);
        this.bytesRead = 0;
    }
    // tslint:disable-next-line: no-any
    _transform(chunk, encoding, callback) {
        this.bytesRead += chunk.length;
        this.emit('progress', this.bytesRead);
        this.push(chunk);
        callback();
    }
}
//# sourceMappingURL=apirequest.js.map