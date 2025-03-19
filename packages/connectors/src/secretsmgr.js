import {
  SecretsManagerClient,
  ListSecretsCommand,
  PutSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import Promise from 'bluebird';

import { defaultDebugLogger } from './log';

class Connector {
  constructor({
    debug,
    timeout = 18000,
    credentials,
  }) {
    this.debug = (msg) => debug('%j', msg);
    this.client = new SecretsManagerClient({
      requestHandler: new NodeHttpHandler({
        requestTimeout: timeout,
        connectionTimeout: timeout,
      }),
      logger: defaultDebugLogger(debug),
      credentials,
    });
  }

  listSecrets(params) {
    return this._sendCommand(new ListSecretsCommand(params));
  }

  putSecretValue(params) {
    return this._sendCommand(new PutSecretValueCommand(params));
  }

  _sendCommand(command) {
    return Promise.resolve(this.client.send(command))
      .tap(this.debug)
      .tapCatch(this.debug);
  }
}

export default Connector;
