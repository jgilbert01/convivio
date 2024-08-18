/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { load } from '../../src/yaml';

describe('yaml.js', () => {
  afterEach(sinon.restore);

  it('should load yaml', () => {
    const doc = load(process.cwd(), './test/unit/fixtures/convivio.yml');
    // console.log(JSON.stringify(doc, null, 2));
    expect(doc).to.deep.equal({
      service: 'my-bff-service',
      // plugins: [
      //   'serverless-webpack',
      //   'satellite',
      // ],
      provider: {
        name: 'aws',
        runtime: 'nodejs18.x',
      },
      custom: '${file(cvo/config.yml):custom}',
      // package: {
      //   individually: true,
      // },
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
