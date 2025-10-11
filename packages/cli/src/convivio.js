import {
  // SyncHook,
  // SyncBailHook,
  // SyncWaterfallHook,
  // SyncLoopHook,
  // AsyncParallelHook,
  // AsyncParallelBailHook,
  AsyncSeriesHook,
  // AsyncSeriesBailHook,
  // AsyncSeriesWaterfallHook,
} from 'tapable';
import cpf from 'cli-progress-footer';

import debug from 'debug';

import defaultConfig from './config';

const log = debug('cvo:cvo');

const progress = cpf();
progress.shouldAddProgressAnimationPrefix = true;

class Convivio {
  constructor(options, overrides = {}) {
    this.options = options;
    this.config = defaultConfig(this, overrides);

    this.hooks = {
      // assumeRole: new AsyncSeriesHook(['convivio', 'progress']),
      parse: new AsyncSeriesHook(['convivio', 'progress']),
      start: new AsyncSeriesHook(['convivio', 'progress']),
      generate: new AsyncSeriesHook(['convivio', 'progress']),
      package: new AsyncSeriesHook(['convivio', 'progress']),
      predeploy: new AsyncSeriesHook(['convivio', 'progress']),
      deploy: new AsyncSeriesHook(['convivio', 'progress']),
      postdeploy: new AsyncSeriesHook(['convivio', 'progress']),
    };

    this.config.plugins.forEach((p) => p.apply(this));

    this.instanceId = new Date().getTime().toString();
  }

  async print() {
    await this.hooks.parse.promise(this, progress);
    console.log(JSON.stringify(this.yaml, null, 2));
  }

  // start-server-and-test integration ???
  async start() {
    await this.hooks.parse.promise(this, progress);
    await this.hooks.start.promise(this, progress);
  }

  async package() {
    await this.hooks.parse.promise(this, progress);
    await this.hooks.generate.promise(this, progress);
    await this.hooks.package.promise(this, progress);
  }

  async deploy() {
    progress.updateProgress('Parsing...');
    await this.hooks.parse.promise(this, progress);

    progress.updateProgress('Compiling...');
    await this.hooks.generate.promise(this, progress);

    progress.updateProgress('Packaging...');
    await this.hooks.package.promise(this, progress);

    progress.updateProgress('Deploying...');
    await this.hooks.predeploy.promise(this, progress);
    await this.hooks.deploy.promise(this, progress);
    await this.hooks.postdeploy.promise(this, progress);

    progress.updateProgress();
  }
}

export default Convivio;
