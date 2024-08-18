import debug from 'debug';

import { getArtifactDirectoryName } from './utils';
// import { upload, cleanup } from './s3';
import { deploy } from './cf';

const log = debug('cvo:deploy');

export class DeployPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.deploy.tapPromise(DeployPlugin.name, async (convivio) => {
      log('%j', { convivio });

      this.bucketName = convivio.yaml.provider.deploymentBucket;
      // this.artifactDirectoryName = getArtifactDirectoryName(convivio);

      try {
      // await upload(this, convivio);
        await deploy(this, convivio);
      // await cleanup(this, convivio);
      } catch (err) {
        console.log(err);
      }
    });
  }
}
