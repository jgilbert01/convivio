import path from 'path';
import debug from 'debug';
import { environment, vcrNock } from '../middleware';
import { context } from './context';

const log = debug('cvo:offline:routes:alb');

const toRequest = (req) => ({ // TODO review logs
  body: req.body,
  headers: req.headers,
  httpMethod: req.method.toUpperCase(),
  isBase64Encoded: false,
  // multiValueHeaders: {
  //   'Host': ['localhost:3001'], 'Accept-Encoding': ['gzip, deflate'], 'User-Agent': ['node-superagent/3.8.3'], 'Connection': ['close'],
  // },
  multiValueQueryStringParameters: null,
  // pathParameters: { proxy: 'things/00000000-0000-0000-0000-000000000000' },
  path: req.path,
  // pathParameters: req.params,
  queryStringParameters: req.query,
  requestContext: {
    elb: {
      targetGroupArn:
        'arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/5811b5d6aff964cd50efa8596604c4e0/b49d49c443aa999f',
    },
  },
  isOffline: true,
});

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
https://docs.aws.amazon.com/lambda/latest/dg/services-alb.html
{
    "requestContext": {
        "elb": {
            "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/lambda-279XGJDqGZ5rsrHC2Fjr/49e9d65c45c6791a"
        }
    },
    "httpMethod": "GET",
    "path": "/lambda",
    "queryStringParameters": {
        "query": "1234ABCD"
    },
    "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng;q=0.8",
        "accept-encoding": "gzip",
        "accept-language": "en-US,en;q=0.9",
        "connection": "keep-alive",
        "host": "lambda-alb-123578498.us-east-1.elb.amazonaws.com",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
        "x-amzn-trace-id": "Root=1-5c536348-3d683b8b04734faae651f476",
        "x-forwarded-for": "72.12.164.125",
        "x-forwarded-port": "80",
        "x-forwarded-proto": "http",
        "x-imforwards": "20"
    },
    "body": "",
    "isBase64Encoded": False
}

*/
