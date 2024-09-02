/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import Convivio from '../../src/convivio';
import TracePlugin from '../../src/trace';

describe('convivio.js', () => {
  afterEach(sinon.restore);

  it('should emit events', () => {
    const options = {
      stage: 'dev',
      region: 'us-west-2',
    };
    const config = {
      plugins: [
        new TracePlugin({ opt: '1' }),
      ],
    };
    const main = new Convivio(config, options);

    const result = main.package();

    expect(result).to.deep.equal({
    });
  });
});
