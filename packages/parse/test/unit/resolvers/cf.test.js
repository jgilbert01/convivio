/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { resolveFromCf } from '../../../src/resolvers';

const options = {
  stage: 'dev',
  region: 'us-west-2',
};

describe('resolves/cf.js', () => {
  afterEach(sinon.restore);

  // TODO mock

  it.skip('should resolve partition', async () => {
    const cf = resolveFromCf({ options });
    const value = await cf({ param: 'us-east-1', address: 'my-event-hub-prd.busName' });
    expect(value).to.equal('my-event-hub-prd-bus');
  });
});
