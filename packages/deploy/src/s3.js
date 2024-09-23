import fs from 'fs';
import debug from 'debug';
import path from 'path';

import { factory } from '@convivio/connectors';

import {
  createFileHash,
  getFileStats,
  getS3EndpointForRegion,
  normalizeCloudFormationTemplate,
} from './utils';

const log = debug('cvo:deploy:s3');

export const upload = async (plugin, convivio) => {
  const connector = factory(convivio.options.region, 's3');

  const exists = checkIfBucketExists(connector, convivio.yaml.provider.deploymentBucket);
  if (!exists) {
    return;
  }

  // save for cf processing
  plugin.Key = `${convivio.yaml.package.artifactDirectoryName}/cloudformation-template.json`;
  plugin.TemplateURL = `https://${getS3EndpointForRegion(convivio)}/${convivio.yaml.provider.deploymentBucket}/${plugin.Key}`;

  await uploadCloudFormationTemplate(connector, plugin, convivio);
  await uploadFunctions(connector, plugin, convivio);
};

const checkIfBucketExists = async (connector, bucketName) => {
  if (!bucketName) return false;

  try {
    await connector.headBucket({
      Bucket: bucketName,
    });
    return true;
  } catch (err) {
    if (err.code === 'AWS_S3_HEAD_BUCKET_NOT_FOUND') { // name ???
      return false;
    }
    throw err;
  }
};

const uploadCloudFormationTemplate = (connector, plugin, convivio) => {
  log('Uploading CloudFormation file to S3');
  // TODO read file if packaged separately
  // ./convivio/cloudformation-template.json

  const normCfTemplate = normalizeCloudFormationTemplate(convivio.json);
  const fileHash = createFileHash(JSON.stringify(normCfTemplate));

  const params = {
    Bucket: convivio.yaml.provider.deploymentBucket,
    Key: plugin.Key,
    Body: JSON.stringify(convivio.json), // compiledCfTemplate
    ContentType: 'application/json',
    Metadata: {
      filesha256: fileHash,
    },
  };

  // const deploymentBucketObject = this.serverless.service.provider.deploymentBucketObject;
  // if (deploymentBucketObject) {
  //   params = setServersideEncryptionOptions(params, deploymentBucketObject);
  // }

  return connector.uploadObject(params);
};

const uploadFunctions = async (connector, plugin, convivio) => {
  await Promise.all(Object.values(convivio.yaml.functions)
    .map((f) => uploadZipFile(connector, plugin, convivio, f)));
};

const uploadZipFile = async (connector, plugin, convivio, f) => {
  // log('%j', { f });
  const artifactFilePath = f.package.artifact;
  const fileName = artifactFilePath.split(path.sep).pop();

  const data = fs.readFileSync(artifactFilePath);
  const fileHash = createFileHash(data);

  const artifactStream = fs.createReadStream(artifactFilePath);
  let streamError;
  artifactStream.on('error', (error) => { streamError = error; });

  const params = {
    Bucket: convivio.yaml.provider.deploymentBucket,
    Key: `${convivio.yaml.package.artifactDirectoryName}/${fileName}`,
    Body: artifactStream,
    ContentType: 'application/zip',
    Metadata: {
      filesha256: fileHash,
    },
  };

  // const deploymentBucketObject = this.serverless.service.provider.deploymentBucketObject;
  // if (deploymentBucketObject) {
  //   params = setServersideEncryptionOptions(params, deploymentBucketObject);
  // }

  const response = await connector.uploadObject(params);
  // Interestingly, if request handling was queued, and stream errored (before being consumed by
  // AWS SDK) then SDK call succeeds without actually uploading a file to S3 bucket.
  // Below line ensures that eventual stream error is communicated
  if (streamError) throw streamError;
  return response;
};

/*

'use strict';

const _ = require('lodash');
const findAndGroupDeployments = require('../../utils/find-and-group-deployments');\
// module.exports = (s3Response, prefix, service, stage) => {
//   if (s3Response.Contents.length) {
//     const regex = new RegExp(`${prefix}/${service}/${stage}/(.+-.+-.+-.+)/(.+)`);
//     const s3Objects = s3Response.Contents.filter((s3Object) => s3Object.Key.match(regex));
//     const names = s3Objects.map((s3Object) => {
//       const match = s3Object.Key.match(regex);
//       return {
//         directory: match[1],
//         file: match[2],
//       };
//     });
//     const grouped = _.groupBy(names, 'directory');
//     return Object.values(grouped);
//   }
//   return [];
// };

const getS3ObjectsFromStacks = require('../../utils/get-s3-objects-from-stacks');
// module.exports = (stacks, prefix, service, stage) =>
//   _.flatten(stacks).map((entry) => ({
//     Key: `${prefix}/${service}/${stage}/${entry.directory}/${entry.file}`,
//   }));

const { log } = require('@serverless/utils/log');

module.exports = {
  async getObjectsToRemove() {
    const stacksToKeepCount = _.get(
      this.serverless,
      'service.provider.deploymentBucketObject.maxPreviousDeploymentArtifacts',
      5
    );

    const service = this.serverless.service.service;
    const stage = this.provider.getStage();
    const prefix = this.provider.getDeploymentPrefix();
  // getDeploymentPrefix() {
  //   const provider = this.serverless.service.provider;
  //   if (provider.deploymentPrefix === null || provider.deploymentPrefix === undefined) {
  //     return 'serverless';
  //   }
  //   return `${provider.deploymentPrefix}`;
  // }

    const response = await this.provider.request('S3', 'listObjectsV2', {
      Bucket: this.bucketName,
      Prefix: `${prefix}/${service}/${stage}`,
    });
    const stacks = findAndGroupDeployments(response, prefix, service, stage);
    const stacksToRemove = stacks.slice(0, -stacksToKeepCount || Infinity);

    return getS3ObjectsFromStacks(stacksToRemove, prefix, service, stage);
  },

  async removeObjects(objectsToRemove) {
    if (!objectsToRemove || !objectsToRemove.length) return;
    await this.provider.request('S3', 'deleteObjects', {
      Bucket: this.bucketName,
      Delete: { Objects: objectsToRemove },
    });
  },

  async cleanupS3Bucket() {
    if (this.serverless.service.provider.deploymentWithEmptyChangeSet) {
      log.info('Removing unnecessary service artifacts from S3');
      await this.cleanupArtifactsForEmptyChangeSet();
    } else {
      log.info('Removing old service artifacts from S3');
      const objectsToRemove = await this.getObjectsToRemove();
      await this.removeObjects(objectsToRemove);
    }
  },

  async cleanupArtifactsForEmptyChangeSet() {
    const response = await this.provider.request('S3', 'listObjectsV2', {
      Bucket: this.bucketName,
      Prefix: this.serverless.service.package.artifactDirectoryName,
    });
    const service = this.serverless.service.service;
    const stage = this.provider.getStage();
    const deploymentPrefix = this.provider.getDeploymentPrefix();

    const objectsToRemove = getS3ObjectsFromStacks(
      findAndGroupDeployments(response, deploymentPrefix, service, stage),
      deploymentPrefix,
      service,
      stage
    );
    await this.removeObjects(objectsToRemove);
  },
};

    */
