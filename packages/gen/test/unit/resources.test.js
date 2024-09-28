/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  AsyncSeriesHook,
} from 'tapable';

import { CorePlugin } from '../../src/core';
import { ResourcesPlugin } from '../../src/resources';

import { CORE } from './fixtures/convivio';

const options = {};

const config = {
  plugins: [
    new CorePlugin(options),
    new ResourcesPlugin(options),
  ],
};

const convivio = {
  options,
  config,
  hooks: {
    generate: new AsyncSeriesHook(['convivio', 'progress']),
  },
  yaml: CORE,
};

convivio.config.plugins.forEach((p) => p.apply(convivio));

describe('resources/index.js', () => {
  afterEach(sinon.restore);

  it('should generate template', async () => {
    await convivio.hooks.generate.promise(convivio);

    // console.log(JSON.stringify(convivio.json, null, 2));

    expect(convivio.json).to.deep.equal({
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'The AWS CloudFormation template for this Serverless application',
      Resources: {
        RestLogGroup: {
          Type: 'AWS::Logs::LogGroup',
          Properties: {
            LogGroupName: '/aws/lambda/my-bff-service-dev-rest',
            RetentionInDays: undefined,
          },
        },
        ListenerLogGroup: {
          Type: 'AWS::Logs::LogGroup',
          Properties: {
            LogGroupName: '/aws/lambda/my-bff-service-dev-listener',
            RetentionInDays: undefined,
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
                          'Fn::Sub': 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/my-bff-service-dev*:*',
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
                          'Fn::Sub': 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/my-bff-service-dev*:*',
                        },
                      ],
                    },
                  ],
                },
              },
            ],
            Path: '/',
            PermissionsBoundary: undefined,
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
        RestLambdaFunction: {
          Type: 'AWS::Lambda::Function',
          Condition: undefined,
          DependsOn: [
            'RestLogGroup',
          ],
          Properties: {
            Code: {
              S3Bucket: 'my-deploy-bucket',
              S3Key: 'convivio/my-bff-service/dev/1725248162835-2024-09-02T03:36:02.835Z/rest.zip',
            },
            Description: undefined,
            FunctionName: 'my-bff-service-dev-rest',
            Handler: 'src/rest/index.handle',
            Runtime: 'nodejs18.x',
            MemorySize: 1024,
            Timeout: 6,
            Architectures: undefined,
            VpcConfig: undefined,
            Environment: {
              Variables: {
                ENTITY_TABLE_NAME: 'my-bff-service-dev-entities',
              },
            },
            Role: {
              'Fn::GetAtt': [
                'IamRoleLambdaExecution',
                'Arn',
              ],
            },
          },
        },
        ListenerLambdaFunction: {
          Type: 'AWS::Lambda::Function',
          Condition: undefined,
          DependsOn: [
            'ListenerLogGroup',
          ],
          Properties: {
            Code: {
              S3Bucket: 'my-deploy-bucket',
              S3Key: 'convivio/my-bff-service/dev/1725248162835-2024-09-02T03:36:02.835Z/listener.zip',
            },
            FunctionName: 'my-bff-service-dev-listener',
            Handler: 'src/listener/index.handle',
            Runtime: 'nodejs18.x',
            MemorySize: 1024,
            Timeout: 6,
            Architectures: undefined,
            Description: undefined,
            VpcConfig: undefined,
            Environment: {
              Variables: {
                ENTITY_TABLE_NAME: 'my-bff-service-dev-entities',
              },
            },
            Role: {
              'Fn::GetAtt': [
                'IamRoleLambdaExecution',
                'Arn',
              ],
            },
          },
        },
        EntitiesTable: {
          Type: 'AWS::DynamoDB::GlobalTable',
          Condition: 'IsWest',
          Properties: {
            TableName: 'template-dev-entities',
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
      Conditions: {},
      Outputs: {},
    });
  });
});
