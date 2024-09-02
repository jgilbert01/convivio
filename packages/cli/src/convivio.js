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

import { mergeConfig } from './utils';

const log = debug('cvo:cvo');

const progress = cpf();
progress.shouldAddProgressAnimationPrefix = true;

class Convivio {
  constructor(options) {
    this.options = options;
    this.config = mergeConfig(this);

    this.hooks = {
      // assumeRole: new AsyncSeriesHook(['convivio', 'progress']),
      parse: new AsyncSeriesHook(['convivio', 'progress']),
      start: new AsyncSeriesHook(['convivio', 'progress']),
      compile: new AsyncSeriesHook(['convivio', 'progress']),
      package: new AsyncSeriesHook(['convivio', 'progress']),
      deploy: new AsyncSeriesHook(['convivio', 'progress']),
    };

    this.config.plugins.forEach((p) => p.apply(this));
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
    await this.hooks.compile.promise(this, progress);
    await this.hooks.package.promise(this, progress);
  }

  async deploy() {
    progress.updateProgress('Parsing...');
    await this.hooks.parse.promise(this, progress);

    progress.updateProgress('Compiling...');
    await this.hooks.compile.promise(this, progress);

    progress.updateProgress('Packaging...');
    await this.hooks.package.promise(this, progress);

    progress.updateProgress('Deploying...');
    await this.hooks.deploy.promise(this, progress);

    progress.updateProgress();
  }
}

export default Convivio;
