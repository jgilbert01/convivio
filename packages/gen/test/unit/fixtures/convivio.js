export const CORE = {
  service: 'my-bff-service',
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: 'us-west-2',
    environment: {
      ENTITY_TABLE_NAME: 'my-bff-service-dev-entities',
    },
  },
  custom: {
    subsys: 'template',
    stage: 'dev',
    region: 'us-west-2',
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
        // ServerlessDeploymentBucket: {
        //   Type: 'AWS::S3::Bucket',
        //   Properties: {
        //     BucketEncryption: {
        //       ServerSideEncryptionConfiguration: [
        //         {
        //           ServerSideEncryptionByDefault: {
        //             SSEAlgorithm: 'AES256',
        //           },
        //         },
        //       ],
        //     },
        //   },
        // },
        // ServerlessDeploymentBucketPolicy: {
        //   Type: 'AWS::S3::BucketPolicy',
        //   Properties: {
        //     Bucket: {
        //       Ref: 'ServerlessDeploymentBucket',
        //     },
        //     PolicyDocument: {
        //       Statement: [
        //         {
        //           Action: 's3:*',
        //           Effect: 'Deny',
        //           Principal: '*',
        //           Resource: [
        //             {
        //               'Fn::Join': [
        //                 '',
        //                 [
        //                   'arn:',
        //                   { Ref: 'AWS::Partition' },
        //                   ':s3:::',
        //                   { Ref: 'ServerlessDeploymentBucket' },
        //                   '/*',
        //                 ],
        //               ],
        //             },
        //             {
        //               'Fn::Join': [
        //                 '',
        //                 [
        //                   'arn:',
        //                   { Ref: 'AWS::Partition' },
        //                   ':s3:::',
        //                   { Ref: 'ServerlessDeploymentBucket' },
        //                 ],
        //               ],
        //             },
        //           ],
        //           Condition: {
        //             Bool: { 'aws:SecureTransport': false },
        //           },
        //         },
        //       ],
        //     },
        //   },
        // },
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
      // Outputs: {
      //   ServerlessDeploymentBucketName: {
      //     Value: {
      //       Ref: 'ServerlessDeploymentBucket',
      //     },
      //   },
      // },
    },
  ],
};
