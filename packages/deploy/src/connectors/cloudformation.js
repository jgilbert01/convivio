import {
  CloudFormationClient,
  CreateChangeSetCommand,
  DeleteChangeSetCommand,
  ExecuteChangeSetCommand,
  DescribeChangeSetCommand,
  DescribeStacksCommand,
  DescribeStackEventsCommand,
  DescribeStackResourceCommand,
  /*
    GetTemplateCommand,
    ValidateTemplateCommand,
    ListStackResourcesCommand,
    DeleteStackCommand,
    */
} from '@aws-sdk/client-cloudformation';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import Promise from 'bluebird';

class Connector {
  constructor({
    debug,
    timeout = 3000,
  }) {
    this.debug = (msg) => debug('%j', msg);
    this.client = new CloudFormationClient({
      requestHandler: new NodeHttpHandler({
        requestTimeout: timeout,
        connectionTimeout: timeout,
      }),
      logger: console, // { log: /* istanbul ignore next */ (msg) => debug('%s', msg.replace(/\n/g, '\r')) },
    });
  }

  createChangeSet(params) {
    return this._sendCommand(new CreateChangeSetCommand(params));
  }

  deleteChangeSet(params) {
    return this._sendCommand(new DeleteChangeSetCommand(params));
  }

  executeChangeSet(params) {
    return this._sendCommand(new ExecuteChangeSetCommand(params));
  }

  describeChangeSet(params) {
    return this._sendCommand(new DescribeChangeSetCommand(params));
  }

  describeStacks(params) {
    return this._sendCommand(new DescribeStacksCommand(params));
  }

  describeStackEvents(params) {
    return this._sendCommand(new DescribeStackEventsCommand(params));
  }

  describeStackResource(params) {
    return this._sendCommand(new DescribeStackResourceCommand(params));
  }

  _sendCommand(command) {
    return Promise.resolve(this.client.send(command))
      .tap(this.debug)
      .tapCatch(this.debug);
  }
}

export default Connector;
