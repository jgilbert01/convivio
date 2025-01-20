import path from 'path';
import crypto from 'crypto';
import debug from 'debug';
import { decodeJwt } from 'jose';
import { environment, vcrNock } from '../middleware';
import { context } from './context';

const log = debug('cvo:offline:routes:rest');

const toAuthorizer = (req) => {
  let token = req.headers.Authorization || req.headers.authorization;
  if (token && token.split(' ')[0] === 'Bearer') {
    [, token] = token.split(' ');
  }

  let claims = {};
  let scopes = []; // TODO array ???

  if (token) {
    log({ token });
    try {
      claims = decodeJwt(token);
      log({ claims });
      if (claims.scp || claims.scope) {
        scopes = claims.scp || claims.scope.split(' ');
      }
    } catch {
      // noop
    }
  }

  return {
    claims,
    principalId: claims.sub || 'offlineContext_authorizer_principalId',
    scopes,
  };
};

const toRequest = (req) => ({ // TODO review logs
  body: req.body,
  httpMethod: req.method.toUpperCase(),
  headers: req.headers,
  // multiValueHeaders: {
  //   'Host': ['localhost:3001'], 'Accept-Encoding': ['gzip, deflate'], 'User-Agent': ['node-superagent/3.8.3'], 'Connection': ['close'],
  // },
  multiValueQueryStringParameters: null,
  // pathParameters: { proxy: 'things/00000000-0000-0000-0000-000000000000' },
  path: req.path,
  pathParameters: req.params,
  queryStringParameters: req.query,
  requestContext: {
    accountId: 'offlineContext_accountId',
    apiId: 'offlineContext_apiId',
    authorizer: toAuthorizer(req),
    httpMethod: req.method.toUpperCase(),
    identity: {
      accountId: 'offlineContext_accountId',
      apiKey: 'offlineContext_apiKey',
      caller: 'offlineContext_caller',
      cognitoAuthenticationProvider: 'offlineContext_cognitoAuthenticationProvider',
      cognitoAuthenticationType: 'offlineContext_cognitoAuthenticationType',
      cognitoIdentityId: 'offlineContext_cognitoIdentityId',
      cognitoIdentityPoolId: 'offlineContext_cognitoIdentityPoolId',
      sourceIp: req.ip,
      user: 'offlineContext_user',
      userAgent: req.headers['user-agent'] || '',
      userArn: 'offlineContext_userArn',
    },
    protocol: 'HTTP/1.1', // TODO ???
    requestId: crypto.randomUUID(),
    //   requestId: 'offlineContext_requestId_ckf9tmzj800011vzrhoekcly8',
    //   requestTimeEpoch: 1600528993747,
    resourceId: 'offlineContext_resourceId',
    //   resourcePath: '/{proxy*}',
    //   stage: 'stg',
  },
  // resource: '/{proxy*}',
  // stageVariables: null,
  isOffline: true,
});

// const toResponse = () => ({
//   multiValueHeaders: {
//     'content-type': ['application/json'],
//     'access-control-allow-origin': ['*'],
//     'access-control-allow-methods': ['GET, PUT, POST, DELETE, OPTIONS'],
//     'access-control-allow-headers': ['Content-Type, Authorization, Content-Length, X-Requested-With'],
//   },
//   statusCode: 200,
//   body: JSON.stringify([{
//     id: '00000000-0000-0000-0000-000000000000',
//     name: 'thing0',
//     timestamp: 1600144863435,
//   }]),
//   isBase64Encoded: false,
// });

export default (servicePath, devServer, f, e, provider, vcr) => {
  // console.log('lambda: ', lambda);
  const ctx = context(f, provider);

  const method = e.http.method === 'any' ? 'all' : e.http.method;
  let _path = e.http.path.replace('{proxy+}', '*');
  if (_path === '*') {
    _path = /^(?!\/2015-03-31\/functions.*$).*/;
  }

  devServer.app[method](
    _path,
    environment(f, provider),
    vcrNock(f, vcr),
    async (req, res) => {
      try {
        const [index, handle] = f.handler.split('.');
        const lambda = require(path.join(servicePath, '.webpack', index)); // , 'service'

        const request = toRequest(req);
        log(request);
        const data = await lambda[handle](
          request,
          ctx,
        );

        // console.log('data: ', data);

        res
          .status(data.statusCode)
          .set(data.headers) // TODO assert size
          .send(data.isBase64Encoded ? Buffer.from(data.body, 'base64') : data.body); // TODO assert size
      } catch (err) {
        console.error(err);
        // TODO response
      }
    },
  );
};

/*

import { Buffer } from "node:buffer"
import crypto from "node:crypto"
import { env } from "node:process"
import { decodeJwt } from "jose"
import { log } from "../../../utils/log.js"
import {
  detectEncoding,
  formatToClfTime,
  nullIfEmpty,
  parseHeaders,
  parseMultiValueHeaders,
  parseMultiValueQueryStringParameters,
  parseQueryStringParameters,
} from "../../../utils/index.js"

const { byteLength } = Buffer
const { parse } = JSON
const { assign } = Object

// https://serverless.com/framework/docs/providers/aws/events/apigateway/
// https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
// http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html
export default class LambdaProxyIntegrationEvent {
  #additionalRequestContext = null

  #path = null

  #routeKey = null

  #request = null

  #stage = null

  constructor(request, stage, path, routeKey, additionalRequestContext) {
    this.#additionalRequestContext = additionalRequestContext || {}
    this.#path = path
    this.#routeKey = routeKey
    this.#request = request
    this.#stage = stage
  }

  create() {
    const authPrincipalId =
      this.#request.auth &&
      this.#request.auth.credentials &&
      this.#request.auth.credentials.principalId

    const authContext =
      (this.#request.auth &&
        this.#request.auth.credentials &&
        this.#request.auth.credentials.context) ||
      {}

    let authAuthorizer

    if (env.AUTHORIZER) {
      try {
        authAuthorizer = parse(env.AUTHORIZER)
      } catch {
        log.error(
          "Could not parse env.AUTHORIZER, make sure it is correct JSON",
        )
      }
    }

    let body = this.#request.payload
    let isBase64Encoded = false

    const { rawHeaders, url } = this.#request.raw.req

    // NOTE FIXME request.raw.req.rawHeaders can only be null for testing (hapi shot inject())
    const headers = parseHeaders(rawHeaders || []) || {}

    if (headers["sls-offline-authorizer-override"]) {
      try {
        authAuthorizer = parse(headers["sls-offline-authorizer-override"])
      } catch {
        log.error(
          "Could not parse header sls-offline-authorizer-override, make sure it is correct JSON",
        )
      }
    }

    if (body) {
      if (
        this.#request.raw.req.payload &&
        detectEncoding(this.#request) === "binary"
      ) {
        body = Buffer.from(this.#request.raw.req.payload).toString("base64")
        headers["Content-Length"] = String(Buffer.byteLength(body, "base64"))
        isBase64Encoded = true
      }

      if (typeof body !== "string") {
        // this.#request.payload is NOT the same as the rawPayload
        body = this.#request.rawPayload
      }

      if (
        !headers["Content-Length"] &&
        !headers["content-length"] &&
        !headers["Content-length"] &&
        (typeof body === "string" ||
          body instanceof Buffer ||
          body instanceof ArrayBuffer)
      ) {
        headers["Content-Length"] = String(byteLength(body))
      }

      // Set a default Content-Type if not provided.
      if (
        !headers["Content-Type"] &&
        !headers["content-type"] &&
        !headers["Content-type"]
      ) {
        headers["Content-Type"] = "application/json"
      }
    } else if (body === undefined || body === "") {
      body = null
    }

    // clone own props
    const pathParams = { ...this.#request.params }

    let token = headers.Authorization || headers.authorization

    if (token && token.split(" ")[0] === "Bearer") {
      ;[, token] = token.split(" ")
    }

    let claims
    let scopes

    if (token) {
      try {
        claims = decodeJwt(token)
        if (claims.scp || claims.scope) {
          scopes = claims.scp || claims.scope.split(" ")
          // In AWS HTTP Api the scope property is removed from the decoded JWT
          // I'm leaving this property because I'm not sure how all of the authorizers
          // for AWS REST Api handle JWT.
          // claims = { ...claims }
          // delete claims.scope
        }
      } catch {
        // Do nothing
      }
    }

    const {
      headers: _headers,
      info: { received, remoteAddress },
      method,
      route,
    } = this.#request

    const httpMethod = method.toUpperCase()
    const requestTime = formatToClfTime(received)
    const requestTimeEpoch = received
    // NOTE replace * added by generateHapiPath util so api gateway event is accurate
    const resource =
      this.#routeKey ||
      route.path.replace(`/${this.#stage}`, "").replace("*", "+")

    return {
      body,
      headers,
      httpMethod,
      isBase64Encoded,
      multiValueHeaders: parseMultiValueHeaders(
        // NOTE FIXME request.raw.req.rawHeaders can only be null for testing (hapi shot inject())
        rawHeaders || [],
      ),
      multiValueQueryStringParameters:
        parseMultiValueQueryStringParameters(url),
      path: this.#path,
      pathParameters: nullIfEmpty(pathParams),
      queryStringParameters: parseQueryStringParameters(url),
      requestContext: {
        accountId: "offlineContext_accountId",
        apiId: "offlineContext_apiId",
        authorizer:
          authAuthorizer ||
          assign(authContext, {
            claims,
            // 'principalId' should have higher priority
            principalId:
              authPrincipalId ||
              env.PRINCIPAL_ID ||
              "offlineContext_authorizer_principalId", // See #24
            scopes,
          }),
        domainName: "offlineContext_domainName",
        domainPrefix: "offlineContext_domainPrefix",
        extendedRequestId: crypto.randomUUID(),
        httpMethod,
        identity: {
          accessKey: null,
          accountId: env.SLS_ACCOUNT_ID || "offlineContext_accountId",
          apiKey: env.SLS_API_KEY || "offlineContext_apiKey",
          apiKeyId: env.SLS_API_KEY_ID || "offlineContext_apiKeyId",
          caller: env.SLS_CALLER || "offlineContext_caller",
          cognitoAuthenticationProvider:
            _headers["cognito-authentication-provider"] ||
            env.SLS_COGNITO_AUTHENTICATION_PROVIDER ||
            "offlineContext_cognitoAuthenticationProvider",
          cognitoAuthenticationType:
            env.SLS_COGNITO_AUTHENTICATION_TYPE ||
            "offlineContext_cognitoAuthenticationType",
          cognitoIdentityId:
            _headers["cognito-identity-id"] ||
            env.SLS_COGNITO_IDENTITY_ID ||
            "offlineContext_cognitoIdentityId",
          cognitoIdentityPoolId:
            env.SLS_COGNITO_IDENTITY_POOL_ID ||
            "offlineContext_cognitoIdentityPoolId",
          principalOrgId: null,
          sourceIp: remoteAddress,
          user: "offlineContext_user",
          userAgent: _headers["user-agent"] || "",
          userArn: "offlineContext_userArn",
        },
        operationName: this.#additionalRequestContext.operationName,
        path: this.#path,
        protocol: "HTTP/1.1",
        requestId: crypto.randomUUID(),
        requestTime,
        requestTimeEpoch,
        resourceId: "offlineContext_resourceId",
        resourcePath: route.path,
        stage: this.#stage,
      },
      resource,
      stageVariables: null,
    }
  }
}

*/
