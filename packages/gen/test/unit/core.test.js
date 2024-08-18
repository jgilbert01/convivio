/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  AsyncSeriesHook,
} from 'tapable';

import { CorePlugin } from '../../src/core';

import { CORE } from './fixtures/convivio';

const options = {};

const config = {
  plugins: [
    new CorePlugin(options),
  ],
};

const convivio = {
  options,
  config,
  hooks: {
    generate: new AsyncSeriesHook(['convivio']),
  },
  yaml: CORE,
};

convivio.config.plugins.forEach((p) => p.apply(convivio));

describe('core/index.js', () => {
  afterEach(sinon.restore);

  it('should generate template', async () => {
    await convivio.hooks.generate.callAsync(convivio);

    expect(convivio.json).to.deep.equal({
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'The AWS CloudFormation template for this Serverless application',
      Resources: {
      },
      Outputs: {
      },
      Conditions: {
      },
    });
  });
});
