/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  AsyncSeriesHook,
} from 'tapable';

import { ParsePlugin } from '../../src/plugin';
import {
  resolveFromObject,
} from '../../src/resolvers';

const options = {
  stage: 'dev',
  region: 'us-west-2',
};
const config = {
  config: './test/unit/fixtures/convivio.yml',
  resolvers: {
    opt: resolveFromObject(options),
    env: resolveFromObject(process.env),
  },
  plugins: [
    new ParsePlugin({}),
  ],
};

const convivio = {
  options,
  config,
  hooks: {
    parse: new AsyncSeriesHook(['convivio']),
  },
  yaml: {},
};

convivio.config.plugins.forEach((p) => p.apply(convivio));

describe('plugin.js', () => {
  afterEach(sinon.restore);

  it('should emit events', async () => {
    await convivio.hooks.parse.promise(convivio);

    expect(convivio.yaml).to.deep.equal({
      service: 'my-bff-service',
      provider: {
        name: 'aws',
        runtime: 'nodejs18.x',
      },
      custom: '${file(cvo/config.yml):custom}',
      functions: {
        rest: {
          handler: 'src/rest/index.handle',
          events: [
            {
              http: {
                method: 'any',
                path: '{proxy+}',
              },
            },
          ],
        },
        listener: {
          handler: 'src/listener/index.handle',
          events: [
            {
              stream: {
                type: 'kinesis',
                arn: 'arn:aws:kinesis:region:XXXXXX:stream/foobar',
                batchSize: 100,
                startingPosition: 'TRIM_HORIZON',
                filterPatterns: [
                  {
                    data: {
                      type: [
                        {
                          prefix: 'thing-',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      resources: [
        '${file(cvo/dynamodb.yml):resources}',
      ],
    });
  });
});
