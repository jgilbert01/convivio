/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  STSClient,
  GetCallerIdentityCommand,
} from '@aws-sdk/client-sts';
import { mockClient } from 'aws-sdk-client-mock';

import { resolveFromAws } from '../../../src/resolvers';

// ${cf:${self:custom.subsys}-event-hub-${opt:stage}.busName}
const options = {
  stage: 'dev',
  region: 'us-west-2',
};

const config = {};

const yaml = {
  provider: {
    name: 'aws',
    region: '${opt:region}',
  },
};

describe('resolves/aws.js', () => {
  let mockSTS;

  beforeEach(() => {
    mockSTS = mockClient(STSClient);
    const spy = sinon.spy((_) => ({
      Account: '123456789012',
      Arn: 'arn:aws:iam::123456789012:user/Tester',
    }));
    mockSTS.on(GetCallerIdentityCommand).callsFake(spy);
  });

  afterEach(() => {
    mockSTS.restore();
    sinon.restore();
  });

  it('should resolve accountId', async () => {
    const aws = resolveFromAws({ options, config, yaml });
    const value = await aws({ address: 'accountId' });
    expect(value).to.equal('123456789012');
  });

  it('should resolve partition', async () => {
    const aws = resolveFromAws({ options, config, yaml });
    const value = await aws({ address: 'partition' });
    expect(value).to.equal('aws');
  });

  it('should resolve region', async () => {
    const aws = resolveFromAws({ options, yaml });
    const value = await aws({ address: 'region' });
    expect(value).to.equal('us-west-2');
  });
});
