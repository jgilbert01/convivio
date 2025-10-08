import {
  normalizeResourceName,
} from '../../utils';

export default (metadata, i) => {
  const FunctionName = {
    'Fn::GetAtt': [
      `${normalizeResourceName(metadata.function.key)}LambdaFunction`,
      'Arn'],
  };
  const Action = 'lambda:InvokeFunction';
  const Principal = 'events.amazonaws.com';

  return {
    Resources: {
      [`${normalizeResourceName(metadata.function.key)}LambdaPermissionEventsRuleSchedule${i}`]: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName,
          Action,
          Principal,
          SourceArn: {
            'Fn::GetAtt': [
              `${normalizeResourceName(metadata.function.key)}EventsRuleSchedule${i}`,
              'Arn',
            ],
          },
        },
      },
    },
  };
};
