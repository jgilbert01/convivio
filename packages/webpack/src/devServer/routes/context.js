import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import debug from 'debug';

const { floor } = Math;

const log = debug('cvo:offline:ctx');

// http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html

export const context = (f, provider) => {
  const executionTimeout = performance.now() + f.timeout || 6000;

  const ctx = {
    // TODO support mocking this
    awsRequestId: crypto.randomUUID(),

    callbackWaitsForEmptyEventLoop: true,
    functionName: f.name,
    functionVersion: '$LATEST',

    // TODO revisit these
    invokedFunctionArn: `offline_invokedFunctionArn_for_${f.name}`,
    logGroupName: `offline_logGroupName_for_${f.name}`,
    logStreamName: `offline_logStreamName_for_${f.name}`,

    memoryLimitInMB: String(f.memorySize ?? provider.memorySize ?? 1024), // NOTE: string in AWS

    clientContext: undefined, // TODO x-amz-client-context
    identity: undefined,

    getRemainingTimeInMillis() {
      const timeLeft = executionTimeout - performance.now();
      // just return 0 for now if we are beyond alotted time (timeout)
      return timeLeft > 0 ? floor(timeLeft) : 0;
    },
  };

  log('%j', ctx);
  return ctx;
};
