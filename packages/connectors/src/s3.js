import { Upload } from '@aws-sdk/lib-storage';
import {
  DeleteObjectsCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import Promise from 'bluebird';

import { defaultDebugLogger } from './log';

class Connector {
  constructor({
    debug,
    timeout = 3000,
  }) {
    this.debug = (msg) => debug('%j', msg);
    this.client = new S3Client({
      requestHandler: new NodeHttpHandler({
        requestTimeout: timeout,
        connectionTimeout: timeout,
      }),
      logger: defaultDebugLogger(debug),
    });
  }

  uploadObject(params) {
    // https://www.mdfaisal.com/blog/how-to-use-aws-s3-in-nodejs
    /*
    const params = {
      Bucket: 'my-bucket',
      Key: 'my-key',
      Body: 'my-body',
    };
    */

    const upload = new Upload({
      client: this.client,
      params,
    });

    upload.on('httpUploadProgress', (progress) => {
      this.debug(progress);
    });

    return upload.done();
  }

  headBucket(params) {
    return this._sendCommand(new HeadBucketCommand(params));
  }

  listObjects(params) {
    return this._sendCommand(new ListObjectsV2Command(params));
  }

  deleteObjects(params) {
    return this._sendCommand(new DeleteObjectsCommand(params));
  }

  _sendCommand(command) {
    return Promise.resolve(this.client.send(command))
      .tap(this.debug)
      .tapCatch(this.debug);
  }
}

export default Connector;
