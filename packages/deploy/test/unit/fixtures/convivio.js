export const BASE = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'The AWS CloudFormation template for this Serverless application',
  Resources: {
    ServerlessDeploymentBucket: {
      Type: 'AWS::S3::Bucket',
      Properties: {
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
  service: 'my-bff-service',
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: 'us-west-2',
  },
  custom: {
    subsys: 'template',
    stage: 'dev',
    region: 'us-west-2',
  },
};
