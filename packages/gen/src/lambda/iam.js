import {
  oneFunctionOrGlobal,
} from '../utils';

// TODO role per function

export default (convivio, functions) => ({
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

                ...(oneFunctionOrGlobal(functions, 'tracing', convivio.yaml.provider.tracing?.lambda) ? [{
                  Effect: 'Allow',
                  Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                  Resource: ['*'],
                }] : []),

                ...(convivio.yaml.provider.kmsKeyArn ? [{
                  Effect: 'Allow',
                  Action: ['kms:Decrypt'],
                  Resource: [convivio.yaml.provider.kmsKeyArn],
                }] : []),
                ...functions
                  .filter((f) => f.kmsKeyArn)
                  .map((f) => ({
                    Effect: 'Allow',
                    Action: ['kms:Decrypt'],
                    Resource: [f.kmsKeyArn],
                  })),
              ],
            },
          },
        ],
        ManagedPolicyArns: managedPolicyArns(convivio, functions),
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

const managedPolicyArns = (convivio, functions) => {
  const arns = [
    ...(convivio.yaml.provider.iam?.role?.managedPolicies || []),

    ...(oneFunctionOrGlobal(functions, 'vpc', convivio.yaml.provider.vpc) ? [{
      'Fn::Join': [
        '',
        [
          'arn:',
          { Ref: 'AWS::Partition' },
          ':iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
        ],
      ],
    }] : []),
  ];

  return arns.length ? arns : undefined;
};
