/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { ConfiguredRetryStrategy } from '@smithy/util-retry';

import { debug as d } from 'debug';
import { defaultDebugLogger } from './utils/log';

const log = d('cvo:testing:lambda');

export const lambdaTest = ({
  functionName,
  endpoint = 'http://localhost:3001',
  timeout = 6000,
  maxAttempt = 8,
  retryDelay = 1000,
  debug = log,
}) => {
  const lambda = new LambdaClient({
    endpoint,
    requestHandler: new NodeHttpHandler({
      requestTimeout: timeout,
      connectionTimeout: timeout,
    }),
    retryStrategy: new ConfiguredRetryStrategy(
      maxAttempt,
      // istanbul ignore next
      (attempt) => 100 + attempt * retryDelay,
    ), // backoff function for when offline is slow to start up
    logger: defaultDebugLogger(debug),
  });

  return (event) => lambda
    .send(new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(event),
    }))
    .then((resp) => {
      debug('%j', { resp });
      return resp;
    })
    .then((resp) => ({
      ...resp,
      Payload: JSON.parse(Buffer.from(resp.Payload)),
    }))
    .then((resp) => {
      if (resp.Payload.errorMessage) {
        console.error('%j', { resp });
        const err = new Error(resp.Payload.errorMessage);
        // stack ???
        err.response = resp;
        throw err;
      }
      return resp;
    });
};
