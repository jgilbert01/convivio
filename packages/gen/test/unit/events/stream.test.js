/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  AsyncSeriesHook,
} from 'tapable';

import { CorePlugin } from '../../../src/core';
import { LambdaPlugin } from '../../../src/lambda';
import { StreamPlugin } from '../../../src/events/stream';
import { ResourcesPlugin } from '../../../src/resources';

import { STREAM } from '../fixtures/convivio';

const options = {
  stage: 'dev',
  region: 'us-west-2',
};

const config = {
  plugins: [
    new CorePlugin(options),
    new LambdaPlugin(options),
    new StreamPlugin(options),
    new ResourcesPlugin(options),
  ],
};

const convivio = {
  options,
  config,
  hooks: {
    generate: new AsyncSeriesHook(['convivio', 'progress']),
  },
  yaml: STREAM,
};

convivio.config.plugins.forEach((p) => p.apply(convivio));

describe('events/stream/index.js', () => {
  afterEach(sinon.restore);

  it('should generate template', async () => {
    await convivio.hooks.generate.promise(convivio);

    expect(convivio.json).to.deep.equal({
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'The AWS CloudFormation template for this Serverless application',
      Resources: {
        ListenerLogGroup: {
          Type: 'AWS::Logs::LogGroup',
          Properties: {
            LogGroupName: '/aws/lambda/my-bff-service-dev-listener',
            // RetentionInDays: undefined,
          },
        },
        IamRoleLambdaExecution: {
          Type: 'AWS::IAM::Role',
          Properties: {
            AssumeRolePolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: [
                      'lambda.amazonaws.com',
                    ],
                  },
                  Action: [
                    'sts:AssumeRole',
                  ],
                },
              ],
            },
            Path: '/',
            // PermissionsBoundary: undefined,
            Policies: [
              {
                PolicyName: {
                  'Fn::Join': [
                    '-',
                    [
                      'my-bff-service',
                      'dev',
                      'lambda',
                    ],
                  ],
                },
                PolicyDocument: {
                  Version: '2012-10-17',
                  Statement: [
                    {
                      Effect: 'Allow',
                      Action: [
                        'logs:CreateLogStream',
                        'logs:CreateLogGroup',
                        'logs:TagResource',
                      ],
                      Resource: [
                        {
                          'Fn::Sub':
                            'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}'
                            + ':log-group:/aws/lambda/my-bff-service-dev*:*',
                        },
                      ],
                    },
                    {
                      Effect: 'Allow',
                      Action: [
                        'logs:PutLogEvents',
                      ],
                      Resource: [
                        {
                          'Fn::Sub':
                            'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}'
                            + ':log-group:/aws/lambda/my-bff-service-dev*:*',
                        },
                      ],
                    },
                    {
                      Action: [
                        'kinesis:GetRecords',
                        'kinesis:GetShardIterator',
                        'kinesis:DescribeStream',
                        'kinesis:DescribeStreamSummary',
                        'kinesis:ListShards',
                        'kinesis:ListStreams',
                      ],
                      Effect: 'Allow',
                      Resource: ['arn:aws:kinesis:region:XXXXXX:stream/foobar'],
                    },
                    {
                      Effect: 'Allow',
                      Action: [
                        'kinesis:SubscribeToShard',
                      ],
                      Resource: [
                        {
                          Ref: 'ListenerConsumer', // 'ListenerfoobarConsumerStreamConsumer',
                        },
                      ],
                    },
                  ],
                },
              },
            ],
            RoleName: {
              'Fn::Join': [
                '-',
                [
                  'my-bff-service',
                  'dev',
                  {
                    Ref: 'AWS::Region',
                  },
                  'lambdaRole',
                ],
              ],

            },
          },
        },
        ListenerLambdaFunction: {
          Type: 'AWS::Lambda::Function',
          // Condition: undefined,
          DependsOn: [
            'ListenerLogGroup',
          ],
          Properties: {
            // Architectures: undefined,
            Runtime: 'nodejs18.x',
            FunctionName: 'my-bff-service-dev-listener',
            // Description: undefined,
            Handler: 'src/listener/index.handle',
            MemorySize: 1024,
            Timeout: 6,
            Role: {
              'Fn::GetAtt': [
                'IamRoleLambdaExecution',
                'Arn',
              ],
            },
            Code: {
              S3Bucket: 'my-deploy-bucket',
              S3Key: 'convivio/my-bff-service/dev/1725248162835-2024-09-02T03:36:02.835Z/listener.zip',
            },
            // VpcConfig: undefined,
          },
        },
        ListenerEventSourceMappingKinesisFoobar: {
          Type: 'AWS::Lambda::EventSourceMapping',
          DependsOn: [
            'IamRoleLambdaExecution',
            'ListenerConsumer',
            // 'ListenerfoobarConsumerStreamConsumer',
          ],
          Properties: {
            BatchSize: 100,
            Enabled: true,
            // EventSourceArn: 'arn:aws:kinesis:region:XXXXXX:stream/foobar',
            EventSourceArn: {
              Ref: 'ListenerConsumer',
            },
            FilterCriteria: {
              Filters: [{
                Pattern: '{\"data\":{\"type\":[{\"prefix\":\"thing-\"}]}}',
              }],
            },
            FunctionName: {
              'Fn::GetAtt': [
                'ListenerLambdaFunction',
                'Arn',
              ],
            },
            StartingPosition: 'TRIM_HORIZON',
          },
        },
        ListenerConsumer: {
          Type: 'AWS::Kinesis::StreamConsumer',
          Properties: {
            ConsumerName: 'template-dev-listener-consumer',
            StreamARN: 'arn:aws:kinesis:region:XXXXXX:stream/template-event-hub-dev-s1',
          },
        },
        // ListenerfoobarConsumerStreamConsumer: {
        //   Type: 'AWS::Kinesis::StreamConsumer',
        //   Properties: {
        //     StreamARN: 'arn:aws:kinesis:region:XXXXXX:stream/foobar',
        //     ConsumerName: 'listenerfoobarConsumer',
        //   },
        // },
      },
      Outputs: {
      },
      Conditions: {
      },
    });
  });
});
