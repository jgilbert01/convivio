/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { parse } from '../../src/parse';
import { resolveFromObject } from '../../src/resolvers';

describe('parse.js', () => {
  afterEach(sinon.restore);

  it('should not replace', async () => {
    expect(await parse('$just:a,string}')).to.equal('$just:a,string}');
  });

  it('should replace opt:stage (solo)', async () => {
    expect(await parse('${opt:stage}', {
      opt: resolveFromObject({
        stage: 'qa',
      }),
    })).to.equal('qa');
  });

  it('should replace opt:stage', async () => {
    expect(await parse('my-service-${opt:stage}', {
      opt: resolveFromObject({
        stage: 'dev',
      }),
    })).to.equal('my-service-dev');
  });

  it('should replace nested self:provider.name', async () => {
    expect(await parse('${self:provider.name}', {
      self: resolveFromObject({
        provider: {
          name: 'aws',
        },
      }),
    })).to.equal('aws');
  });

  it('should replace static default value', async () => {
    expect(await parse('my-service-${opt:region, west}-more', {
      opt: resolveFromObject({
        stage: 'dev',
        region: undefined,
      }),
    })).to.equal('my-service-west-more');
  });

  it('should replace dynamic default value', async () => {
    expect(await parse('my-service-${opt:region, ${env:AWS_REGION, west}}', {
      opt: resolveFromObject({
        stage: 'dev',
        region: undefined,
      }),
      env: resolveFromObject({
        AWS_REGION: 'east',
      }),
    })).to.equal('my-service-east');
  });

  it('should replace dynamic default value with static default', async () => {
    expect(await parse('my-service-${opt:region, ${env:AWS_REGION, west}}', {
      opt: resolveFromObject({
        stage: 'dev',
        region: undefined,
      }),
      env: resolveFromObject({
        AWS_REGION: undefined,
      }),
    })).to.equal('my-service-west');
  });
});
