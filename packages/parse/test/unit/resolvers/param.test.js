/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { resolveFromParam } from '../../../src/resolvers';

const yaml = {
  params: {
    dev: {
      p1: 'v2',
    },
    qa: {
      p1: 'v3',
    },
    default: {
      p1: 'v1',
    },
  },
};

describe('resolves/param.js', () => {
  afterEach(sinon.restore);

  it('should resolve dev param', async () => {
    const param = resolveFromParam({ options: { stage: 'dev' }, yaml });
    const value = await param({ address: 'p1' });
    expect(value).to.equal('v2');
  });

  it('should resolve qa param', async () => {
    const param = resolveFromParam({ options: { stage: 'qa' }, yaml });
    const value = await param({ address: 'p1' });
    expect(value).to.equal('v3');
  });

  it('should resolve default param', async () => {
    const param = resolveFromParam({ options: { stage: 'prd' }, yaml });
    const value = await param({ address: 'p1' });
    expect(value).to.equal('v1');
  });
});
