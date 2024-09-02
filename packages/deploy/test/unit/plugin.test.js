/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  AsyncSeriesHook,
} from 'tapable';

import { DeployPlugin } from '../../src/plugin';

import { BASE, CORE } from './fixtures/convivio';

const options = {
  stage: 'dev',
};

const config = {
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

  it('should generate template', async () => {
    await convivio.hooks.deploy.promise(convivio, { updateProgress: console.log });

    // expect(convivio.json).to.deep.equal({});
  });
});
