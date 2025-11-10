import {
  STSClient,
  GetCallerIdentityCommand,
} from '@aws-sdk/client-sts';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import Promise from 'bluebird';

import { defaultDebugLogger } from './log';

class Connector {
  constructor({
    debug,
    timeout = 18000,
    credentials,
    region,
  }) {
    this.debug = (msg) => debug('%j', msg);
    this.client = new STSClient({
      requestHandler: new NodeHttpHandler({
        requestTimeout: timeout,
        connectionTimeout: timeout,
      }),
      logger: defaultDebugLogger(debug),
      credentials,
      region,
    });
  }

  getCallerIdentity() {
    return this._sendCommand(new GetCallerIdentityCommand({}));
  }

  _sendCommand(command) {
    return Promise.resolve(this.client.send(command))
      .tap(this.debug)
      .tapCatch(this.debug);
  }
}

export default Connector;
