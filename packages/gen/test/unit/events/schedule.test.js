/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  AsyncSeriesHook,
} from 'tapable';

import { CorePlugin } from '../../../src/core';
import { LambdaPlugin } from '../../../src/lambda';
import { SchedulePlugin } from '../../../src/events/schedule';
import { ResourcesPlugin } from '../../../src/resources';

import { SCHEDULE } from '../fixtures/convivio';

const options = {
  stage: 'dev',
  region: 'us-west-2',
};

const config = {
  plugins: [
    new CorePlugin(options),
    new LambdaPlugin(options),
    new SchedulePlugin(options),
    new ResourcesPlugin(options),
  ],
};

const convivio = {
  options,
  config,
  hooks: {
    generate: new AsyncSeriesHook(['convivio', 'progress']),
  },
  yaml: SCHEDULE,
};

convivio.config.plugins.forEach((p) => p.apply(convivio));

describe('events/schedule/index.js', () => {
  afterEach(sinon.restore);

  it('should generate template', async () => {
    await convivio.hooks.generate.promise(convivio);

    expect(convivio.json).to.deep.equal({
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'The AWS CloudFormation template for this Serverless application',
      Resources: {
        JobLogGroup: {
          Type: 'AWS::Logs::LogGroup',
          Properties: {
            LogGroupName: '/aws/lambda/my-bff-service-dev-job',
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
        JobLambdaFunction: {
          Type: 'AWS::Lambda::Function',
          DependsOn: [
            'JobLogGroup',
          ],
          Properties: {
            Runtime: 'nodejs18.x',
            FunctionName: 'my-bff-service-dev-job',
            Handler: 'src/job/index.handle',
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
              S3Key: 'convivio/my-bff-service/dev/1725248162835-2024-09-02T03:36:02.835Z/job.zip',
            },
          },
        },
        JobEventsRuleSchedule1: {
          Type: 'AWS::Events::Rule',
          Properties: {
            ScheduleExpression: 'cron(5 7 1 JAN,APR,JUL,OCT ? *)',
            State: 'ENABLED',
            Targets: [
              {
                Input: '{"discriminator":"job-x"}',
                Arn: {
                  'Fn::GetAtt': [
                    'JobLambdaFunction',
                    'Arn',
                  ],
                },
                Id: 'jobSchedule',
              },
            ],
          },
        },
        JobLambdaPermissionEventsRuleSchedule1: {
          Type: 'AWS::Lambda::Permission',
          Properties: {
            FunctionName: {
              'Fn::GetAtt': [
                'JobLambdaFunction',
                'Arn',
              ],
            },
            Action: 'lambda:InvokeFunction',
            Principal: 'events.amazonaws.com',
            SourceArn: {
              'Fn::GetAtt': [
                'JobEventsRuleSchedule1',
                'Arn',
              ],
            },
          },
        },
      },
      Outputs: {
      },
      Conditions: {
      },
    });
  });
});
