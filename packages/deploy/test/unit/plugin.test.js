/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  AsyncSeriesHook,
} from 'tapable';

import { DeployPlugin } from '../../src/plugin';

import {
  BASE, CORE, FUNCT_YAML, FUNCT_JSON,
} from './fixtures/convivio';

const options = {
  stage: 'dev',
  region: 'us-west-2',
};

const config = {
  basedir: './test/unit',
  plugins: [
    new DeployPlugin(options),
  ],
};

const convivio = {
  options,
  config,
  hooks: {
    deploy: new AsyncSeriesHook(['convivio', 'progress']),
  },
  yaml: CORE,
  json: BASE,
};

convivio.config.plugins.forEach((p) => p.apply(convivio));

describe('plugin/index.js', () => {
  afterEach(sinon.restore);

  it('should deploy initial template', async () => {
    await convivio.hooks.deploy.promise(convivio, { updateProgress: console.log });
  });

  it('should deploy function template', async () => {
    convivio.yaml = FUNCT_YAML;
    convivio.json = FUNCT_JSON;
    await convivio.hooks.deploy.promise(convivio, { updateProgress: console.log });
  });
});
