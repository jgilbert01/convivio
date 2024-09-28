/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { resolveFromAws } from '../../../src/resolvers';

// ${cf:${self:custom.subsys}-event-hub-${opt:stage}.busName}
const options = {
  stage: 'dev',
  region: 'us-west-2',
};

const yaml = {
  provider: {
    name: 'aws',
    region: '${opt:region}',
  },
};

describe('resolves/aws.js', () => {
  afterEach(sinon.restore);

  // TODO mock

  it.skip('should resolve accountId', async () => {
    const aws = resolveFromAws({ options, yaml });
    const value = await aws({ address: 'accountId' });
    expect(value).to.equal('115437272459');
  });

  it('should resolve partition', async () => {
    const aws = resolveFromAws({ options, yaml });
    const value = await aws({ address: 'partition' });
    expect(value).to.equal('aws');
  });

  it('should resolve region', async () => {
    const aws = resolveFromAws({ options, yaml });
    const value = await aws({ address: 'region' });
    expect(value).to.equal('us-west-2');
  });
});
