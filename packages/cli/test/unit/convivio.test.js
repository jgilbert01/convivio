/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import Convivio from '../../src/convivio';
// import TracePlugin from '../../src/trace';

describe('convivio.js', () => {
  afterEach(sinon.restore);

  it.only('should emit events', async () => {
    const options = {
      stage: 'dev',
      region: 'us-west-2',
    };
    // const config = {
    //   config: ['./test/unit/convivio.yml'],
    //   plugins: [
    //     new TracePlugin({ opt: '1' }),
    //   ],
    // };
    const main = new Convivio(options, {
      config: ['./test/unit/convivio.yml'],
    });

    const result = await main.package();

    // console.log(JSON.stringify(main.yaml, null, 2));
    expect(main.yaml).to.deep.equal({
      service: 'test-bff-service',
      provider: {
        name: 'aws',
      },
      functions: {
        test: {
          handler: 'test/unit/handler.handler',
          key: 'test',
          name: 'test-bff-service-dev-test',
          handlerEntry: {
            key: 'test/unit/handler',
            value: './test/unit/handler.js',
          },
          package: {
            artifact: './.webpack/test.zip',
          },
        },
      },
      resources: {
        Resources: {
          Bucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketName: 'test-bff-service',
            },
          },
        },
      },
    });
    // console.log(JSON.stringify(main.json, null, 2));
    expect(main.json).to.deep.equal({
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'The AWS CloudFormation template for this Serverless application',
      Resources: {
        TestLogGroup: {
          Type: 'AWS::Logs::LogGroup',
          Properties: {
            LogGroupName: '/aws/lambda/test-bff-service-dev-test',
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
            Policies: [
              {
                PolicyName: {
                  'Fn::Join': [
                    '-',
                    [
                      'test-bff-service',
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
                          'Fn::Sub': 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/test-bff-service-dev*:*',
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
                          'Fn::Sub': 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/test-bff-service-dev*:*',
                        },
                      ],
                    },
                  ],
                },
              },
            ],
            Path: '/',
            // PermissionsBoundary: undefined,
            RoleName: {
              'Fn::Join': [
                '-',
                [
                  'test-bff-service',
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
        TestLambdaFunction: {
          Type: 'AWS::Lambda::Function',
          // Condition: undefined,
          DependsOn: [
            'TestLogGroup',
          ],
          Properties: {
            FunctionName: 'test-bff-service-dev-test',
            Handler: 'test/unit/handler.handler',
            Runtime: 'nodejs20.x',
            MemorySize: 1024,
            Timeout: 6,
            Role: {
              'Fn::GetAtt': [
                'IamRoleLambdaExecution',
                'Arn',
              ],
            },
            // Architectures: undefined,
            // Code: undefined,
            // Description: undefined,
            // Environment: undefined,
            // FunctionName: undefined,
            // VpcConfig: undefined,
          },
        },
        Bucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: 'test-bff-service',
          },
        },
      },
      Conditions: {},
      Outputs: {},
    });
  }).timeout(5000);
});
