import debug from 'debug';

import { compile } from './compile';
import { start } from './devServer';

const log = debug('cvo:webpack:plugin');

export class WebpackPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.start.tapPromise(WebpackPlugin.name, startHook);
    cvo.hooks.package.tapPromise(WebpackPlugin.name, packageHook);
  }
}

const startHook = async (convivio, progress) => {
  log('%j', { convivio });

  if (!convivio.yaml.functions) return;

  try {
    const { basedir } = convivio.config;
    const { service } = convivio.yaml;
    const configuration = convivio.yaml.custom?.webpack || {};
    const { functions } = convivio.yaml;

    await start(basedir, service, configuration, functions, convivio.yaml.provider);
  } catch (err) {
    console.log(err);
  }
};

const packageHook = async (convivio, progress) => {
  log('%j', { convivio });

  if (!convivio.yaml.functions) return;

  try {
    const { basedir } = convivio.config;
    const { service } = convivio.yaml;
    const configuration = convivio.yaml.custom?.webpack || {};
    const { functions } = convivio.yaml;
    // TODO cleanup/normalize args
    await compile(basedir, service, configuration, functions);

    // await package(this, convivio);
    // await deploy(this, convivio, progress);
    // await cleanup(this, convivio);
  } catch (err) {
    console.log(err);
  }
};
