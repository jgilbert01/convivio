// TODO role per function

export default (metadata, convivio) => ({
  Resources: {
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
                  convivio.yaml.service,
                  convivio.options.stage,
                  'lambda',
                ],
              ],
            },
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                // TODO logs disabled
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
                                            + `:log-group:/aws/lambda/${convivio.yaml.service}-${convivio.options.stage}*:*`,
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
                                            + `:log-group:/aws/lambda/${convivio.yaml.service}-${convivio.options.stage}*:*`,
                    },
                  ],
                },

                ...(convivio.yaml.provider.iam?.role?.statements || []),

              ],
            },
          },
        ],
        Path: convivio.yaml.provider.iam?.role?.path || '/',
        RoleName: convivio.yaml.provider.iam?.role?.name || {
          'Fn::Join': [
            '-',
            [
              convivio.yaml.service,
              convivio.options.stage,
              {
                Ref: 'AWS::Region',
              },
              'lambdaRole',
            ],
          ],
        },
        PermissionsBoundary: convivio.yaml.provider.iam?.role?.permissionsBoundary,
      },
    },
  },
});

// if (iam.role.tags) {
//     iamRoleLambdaExecutionTemplate.Properties.Tags = Object.keys(iam.role.tags).map((key) => ({
//       Key: key,
//       Value: iam.role.tags[key],
//     }));
//   }

// provider.iam.role.managedPolicies

// TODO Stream Event
// {
//     Effect: 'Allow',
//     Action: [
//         'dynamodb:GetRecords',
//         'dynamodb:GetShardIterator',
//         'dynamodb:DescribeStream',
//         'dynamodb:ListStreams'
//     ],
//     Resource: [
//         {
//             'Fn::GetAtt': [
//                 'EntitiesTable',
//                 'StreamArn'
//             ]
//         }
//     ]
// },

// TODO SQS event
// {
//     Effect: 'Allow',
//     Action: [
//         'sqs:ReceiveMessage',
//         'sqs:DeleteMessage',
//         'sqs:GetQueueAttributes'
//     ],
//     Resource: [
//         {
//             'Fn::GetAtt': [
//                 'ListenerQueue',
//                 'Arn'
//             ]
//         }
//     ]
// }

// // check if one of the functions contains vpc configuration
// const vpcConfigProvided = this.serverless.service.getAllFunctions().some((functionName) => {
//     const functionObject = this.serverless.service.getFunction(functionName);
//     return 'vpc' in functionObject;
//   });

//   if (vpcConfigProvided || this.serverless.service.provider.vpc) {
//     // add managed iam policy to allow ENI management
//     this.mergeManagedPolicies([
//       {
//         'Fn::Join': [
//           '',
//           [
//             'arn:',
//             { Ref: 'AWS::Partition' },
//             ':iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
//           ],
//         ],
//       },
//     ]);
//   }
