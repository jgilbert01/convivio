/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { resolveAll } from '../../src/resolve';
import {
  resolveFromObject,
  resolveFromSelf,
  resolveFromFile,
} from '../../src/resolvers';

const options = {
  stage: 'dev',
  region: 'us-west-2',
};

const yaml = {
  service: '${self:custom.subsys}-bff-service',
  // plugins: [
  //   'serverless-webpack',
  //   'satellite',
  // ],
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: '${opt:region}',
    environment: '${file(cvo/config.yml):environment}',
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
            arn: '${env:STREAM_ARN}',
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
};

describe('resolve.js', () => {
  afterEach(sinon.restore);

  it('should resolve yaml', async () => {
    const resolvers = {
      opt: resolveFromObject(options),
      env: resolveFromObject({
        STREAM_ARN: 'arn:aws:kinesis:region:XXXXXX:stream/foobar',
      }),
      self: resolveFromSelf({ yaml }),
      file: resolveFromFile('./test/unit/fixtures'),
    };
    const doc = await resolveAll(yaml, resolvers);
    // console.log(JSON.stringify(doc, null, 2));
    expect(doc).to.deep.equal({
      service: 'template-bff-service',
      // plugins: [
      //   'serverless-webpack',
      //   'satellite',
      // ],
      provider: {
        name: 'aws',
        runtime: 'nodejs18.x',
        region: 'us-west-2',
        environment: {
          ENTITY_TABLE_NAME: 'template-bff-service-dev-entities',
        },
      },
      // custom: '${file(cvo/config.yml):custom}',
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
        {
          Resources: {
            EntitiesTable: {
              Type: 'AWS::DynamoDB::GlobalTable',
              Condition: 'IsWest',
              Properties: {
                TableName: 'template-bff-service-dev-entities',
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
