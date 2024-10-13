export const CORE = {
  service: 'my-bff-service',
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: 'us-west-2',
    deploymentBucket: 'my-deploy-bucket',
    environment: {
      ENTITY_TABLE_NAME: 'my-bff-service-dev-entities',
    },
  },
  package: {
    artifactDirectoryName: 'convivio/my-bff-service/dev/1725248162835-2024-09-02T03:36:02.835Z',
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

      key: 'rest',
      name: 'my-bff-service-dev-rest',
      handlerEntry: { key: 'src/rest/index', value: './src/rest/index.js' },
      package: { artifact: './.webpack/rest.zip' },

      events: [
        {
          http: {
            method: 'any',
            path: '{proxy+}',
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

export const LAMBDA = {
  service: 'my-bff-service',
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: 'us-west-2',
    deploymentBucket: 'my-deploy-bucket',
    environment: {
      ENTITY_TABLE_NAME: 'my-bff-service-dev-entities',
    },
  },
  package: {
    artifactDirectoryName: 'convivio/my-bff-service/dev/1725248162835-2024-09-02T03:36:02.835Z',
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

      key: 'rest',
      name: 'my-bff-service-dev-rest',
      handlerEntry: { key: 'src/rest/index', value: './src/rest/index.js' },
      package: { artifact: './.webpack/rest.zip' },

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

      key: 'listener',
      name: 'my-bff-service-dev-listener',
      handlerEntry: { key: 'src/listener/index', value: './src/listener/index.js' },
      package: { artifact: './.webpack/listener.zip' },

      events: [
        {
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
    },
  ],
};

export const STREAM = {
  service: 'my-bff-service',
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: 'us-west-2',
    deploymentBucket: 'my-deploy-bucket',
  },
  package: {
    artifactDirectoryName: 'convivio/my-bff-service/dev/1725248162835-2024-09-02T03:36:02.835Z',
  },
  custom: {
    subsys: 'template',
    stage: 'dev',
    region: 'us-west-2',
  },
  functions: {
    listener: {
      handler: 'src/listener/index.handle',

      key: 'listener',
      name: 'my-bff-service-dev-listener',
      handlerEntry: { key: 'src/listener/index', value: './src/listener/index.js' },
      package: { artifact: './.webpack/listener.zip' },

      events: [
        {
          stream: {
            type: 'kinesis',
            arn: 'arn:aws:kinesis:region:XXXXXX:stream/foobar',
            consumer: { // true,
              Ref: 'ListenerConsumer',
            },
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
        ListenerConsumer: {
          Type: 'AWS::Kinesis::StreamConsumer',
          Properties: {
            ConsumerName: 'template-dev-listener-consumer',
            StreamARN: 'arn:aws:kinesis:region:XXXXXX:stream/template-event-hub-dev-s1',
          },
        },
      },
    },
  ],
};
