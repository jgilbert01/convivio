import {
  ACMClient,
  GetCertificateCommand,
  ImportCertificateCommand,
} from '@aws-sdk/client-acm';
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
    this.client = new ACMClient({
      requestHandler: new NodeHttpHandler({
        requestTimeout: timeout,
        connectionTimeout: timeout,
      }),
      logger: defaultDebugLogger(debug),
      credentials,
    });
  }

  getCertificate(param) {
    return this._sendCommand(new GetCertificateCommand(param));
  }

  importCertificate(param) {
    return this._sendCommand(new ImportCertificateCommand(param));
  }

  _sendCommand(command) {
    return Promise.resolve(this.client.send(command))
      .tap(this.debug)
      .tapCatch(this.debug);
  }
}

export default Connector;
