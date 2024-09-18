import debug from 'debug';

import { upload } from './s3';
import { deploy } from './cf';

const log = debug('cvo:deploy:plugin');

export class DeployPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.deploy.tapPromise(DeployPlugin.name, async (convivio, progress) => {
      log('%j', { convivio });

      try {
        await upload(this, convivio, progress);
        await deploy(this, convivio, progress);
        // await cleanup(this, convivio);
      } catch (err) {
        console.log(err);
      }
    });
  }
}
