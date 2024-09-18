/* eslint no-template-curly-in-string: 0 */

export const BASE = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'The AWS CloudFormation template for this Serverless application',
  Resources: {
    ServerlessDeploymentBucket: {
      Type: 'AWS::S3::Bucket',
      Properties: {
        BucketName: 'my-cvo-deploy-dev-us-west-2',
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      },
    },
    ServerlessDeploymentBucketPolicy: {
      Type: 'AWS::S3::BucketPolicy',
      Properties: {
        Bucket: {
          Ref: 'ServerlessDeploymentBucket',
        },
        PolicyDocument: {
          Statement: [
            {
              Action: 's3:*',
              Effect: 'Deny',
              Principal: '*',
              Resource: [
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      { Ref: 'AWS::Partition' },
                      ':s3:::',
                      { Ref: 'ServerlessDeploymentBucket' },
                      '/*',
                    ],
                  ],
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      { Ref: 'AWS::Partition' },
                      ':s3:::',
                      { Ref: 'ServerlessDeploymentBucket' },
                    ],
                  ],
                },
              ],
              Condition: {
                Bool: { 'aws:SecureTransport': false },
              },
            },
          ],
        },
      },
    },
  },
  Outputs: {
    ServerlessDeploymentBucketName: {
      Value: {
        Ref: 'ServerlessDeploymentBucket',
      },
    },
  },
  Conditions: {
  },
};

export const CORE = {
  service: 'my-pipeline-resources',
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: 'us-west-2',
  },
  custom: {
    subsys: 'my',
    stage: 'dev',
    region: 'us-west-2',
  },
};

export const FUNCT_YAML = {
  service: 'my-bff-service',
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    deploymentBucket: 'my-cvo-deploy-dev-us-west-2',
  },
  package: {
    artifactDirectoryName: 'convivio/my-bff-service/dev/1725248162835-2024-09-02T03:36:02.835Z',
  },
  functions: {
    listener: {
      handler: 'src/listener/index.handle',

      key: 'listener',
      name: 'my-bff-service-dev-listener',
      handlerEntry: { key: 'src/listener/index', value: './src/listener/index.js' },
      package: { artifact: './test/unit/.webpack/listener.zip' },
    },
  },
};

export const FUNCT_JSON = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'The AWS CloudFormation template for this Serverless application',
  Resources: {
    ListenerLogGroup: {
      Type: 'AWS::Logs::LogGroup',
      Properties: {
        LogGroupName: '/aws/lambda/my-bff-service-dev-listener',
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
      DependsOn: [
        'ListenerLogGroup',
      ],
      Properties: {
        Code: {
          S3Bucket: 'my-cvo-deploy-dev-us-west-2',
          S3Key: 'convivio/my-bff-service/dev/1725248162835-2024-09-02T03:36:02.835Z/listener.zip',
        },
        FunctionName: 'my-bff-service-dev-listener',
        Handler: 'src/listener/index.handle',
        Runtime: 'nodejs18.x',
        MemorySize: 1024,
        Timeout: 6,
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
      // Condition: 'IsWest',
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
};
