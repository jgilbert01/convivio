import path from 'path';
import debug from 'debug';
import { environment, vcrNock } from '../middleware';
import { context } from './context';

const log = debug('cvo:offline:routes:rest');

const toRequest = (req) => ({ // TODO review logs
  body: req.body,
  headers: req.headers,
  httpMethod: req.method.toUpperCase(),
  // multiValueHeaders: {
  //   'Host': ['localhost:3001'], 'Accept-Encoding': ['gzip, deflate'], 'User-Agent': ['node-superagent/3.8.3'], 'Connection': ['close'],
  // },
  multiValueQueryStringParameters: null,
  path: req.path,
  // pathParameters: { proxy: 'things/00000000-0000-0000-0000-000000000000' },
  pathParameters: req.params,
  queryStringParameters: req.query,
  requestContext: {
    accountId: 'offlineContext_accountId',
    apiId: 'offlineContext_apiId',
    //   authorizer: { principalId: 'offlineContext_authorizer_principalId' },
    httpMethod: req.method.toUpperCase(),
    identity: {
      accountId: 'offlineContext_accountId',
      apiKey: 'offlineContext_apiKey',
      caller: 'offlineContext_caller',
      // cognitoAuthenticationProvider: 'offlineContext_cognitoAuthenticationProvider',
      // cognitoAuthenticationType: 'offlineContext_cognitoAuthenticationType',
      // cognitoIdentityId: 'offlineContext_cognitoIdentityId',
      // cognitoIdentityPoolId: 'offlineContext_cognitoIdentityPoolId',
      sourceIp: req.ip,
      // user: 'offlineContext_user',
      // userAgent: 'node-superagent/3.8.3',
      userArn: 'offlineContext_userArn',
    },
    //   protocol: 'HTTP/1.1',
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
  const [index, handle] = f.handler.split('.');
  const lambda = require(path.join(servicePath, '.webpack', 'service', index));
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
        const data = await lambda[handle](
          toRequest(req),
          ctx,
        );

        // console.log('data: ', data);

        res
          .status(data.statusCode)
          .set(data.headers)
          .send(data.body);
      } catch (err) {
        console.error(err);
        // TODO response
      }
    },
  );
};
