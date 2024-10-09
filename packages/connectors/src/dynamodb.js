import {
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DescribeTableCommand,
} from '@aws-sdk/lib-dynamodb';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import Promise from 'bluebird';

import { defaultDebugLogger } from './log';

class Connector {
  constructor({
    debug,
    timeout = 3000,
    credentials,
  }) {
    this.debug = (msg) => debug('%j', msg);
    this.client = DynamoDBDocumentClient.from(new DynamoDBClient({
      requestHandler: new NodeHttpHandler({
        requestTimeout: timeout,
        connectionTimeout: timeout,
      }),
      logger: defaultDebugLogger(debug),
      credentials,
    }));
  }

  describeTable(params) {
    return this._sendCommand(new DescribeTableCommand(params));
  }

  _sendCommand(command) {
    return Promise.resolve(this.client.send(command))
      .tap(this.debug)
      .tapCatch(this.debug);
  }
}

export default Connector;
