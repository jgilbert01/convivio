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
  resolveFromFile,
  resolveFromSelf,
} from '../../src/resolvers';

const options = {
  stage: 'dev',
  region: 'us-west-2',
};
const config = {
  basedir: process.cwd(),
  config: ['./test/unit/fixtures/convivio.yml'],
  resolvers: {
    opt: resolveFromObject(options),
    env: resolveFromObject(process.env),
    self: resolveFromSelf({ yaml: {} }),
    file: resolveFromFile('./test/unit/fixtures'),
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

    // console.log(JSON.stringify(convivio.yaml, null, 2));

    expect(convivio.yaml).to.deep.equal({
      service: 'my-bff-service',
      provider: {
        name: 'aws',
        runtime: 'nodejs18.x',
      },
      custom: {
        subsys: 'template',
        stage: 'dev',
        region: 'us-west-2',
        webpack: {
          includeModules: true,
        },
        tableStreamArn: {
          'us-west-2': {
            'Fn::GetAtt': [
              'EntitiesTable',
              'StreamArn',
            ],
          },
          'us-east-1': {
            'Fn::GetAtt': [
              'EntitiesTable',
              'StreamArn',
            ],
          },
        },
      },
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
          key: 'rest',
          name: 'my-bff-service-dev-rest',
          handlerEntry: {
            key: 'src/rest/index',
            value: './src/rest/index.js',
          },
          package: {
            artifact: './.webpack/rest.zip',
          },
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
          key: 'listener',
          name: 'my-bff-service-dev-listener',
          handlerEntry: {
            key: 'src/listener/index',
            value: './src/listener/index.js',
          },
          package: {
            artifact: './.webpack/listener.zip',
          },
        },
      },
      resources: [
        {
          Resources: {
            EntitiesTable: {
              Type: 'AWS::DynamoDB::GlobalTable',
              Condition: 'IsWest',
              Properties: {
                TableName: '${self:provider.environment.ENTITY_TABLE_NAME}',
                AttributeDefinitions: [
                  {
                    AttributeName: 'pk',
                    AttributeType: 'S',
                  },
                  {
                    AttributeName: 'sk',
                    AttributeType: 'S',
                  },
                  {
                    AttributeName: 'discriminator',
                    AttributeType: 'S',
                  },
                ],
                KeySchema: [
                  {
                    AttributeName: 'pk',
                    KeyType: 'HASH',
                  },
                  {
                    AttributeName: 'sk',
                    KeyType: 'RANGE',
                  },
                ],
                GlobalSecondaryIndexes: [
                  {
                    IndexName: 'gsi1',
                    KeySchema: [
                      {
                        AttributeName: 'discriminator',
                        KeyType: 'HASH',
                      },
                      {
                        AttributeName: 'pk',
                        KeyType: 'RANGE',
                      },
                    ],
                    Projection: {
                      ProjectionType: 'ALL',
                    },
                  },
                ],
                Replicas: [
                  {
                    Region: 'us-west-2',
                  },
                  {
                    Region: 'us-east-1',
                  },
                ],
                BillingMode: 'PAY_PER_REQUEST',
                StreamSpecification: {
                  StreamViewType: 'NEW_AND_OLD_IMAGES',
                },
                TimeToLiveSpecification: {
                  AttributeName: 'ttl',
                  Enabled: true,
                },
                SSESpecification: {
                  SSEEnabled: true,
                },
              },
            },
          },
        },
      ],
    });
  });
});
