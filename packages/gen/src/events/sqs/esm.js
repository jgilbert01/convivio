import {
  get,
  normalizeNameToAlphaNumericOnly,
  normalizeResourceName,
} from '../../utils';

export default (metadata, convivio) => ({
  Resources: {
    ...sqs(metadata, convivio),
  },
});

const sqs = (metadata, convivio) => ({
  [`${normalizeResourceName(metadata.function.key)}EventSourceMappingSQS${normalizeNameToAlphaNumericOnly(queueName(metadata.sqs, convivio))}`]: {
    Type: 'AWS::Lambda::EventSourceMapping',
    DependsOn: [
      'IamRoleLambdaExecution',
      // targetAlias.logicalId - Alias not currently used, so not supported yet
    ],
    Properties: {
      BatchSize: get(metadata.sqs, convivio, 'batchSize', 10), // max 100
      Enabled: metadata.sqs.enabled || true,

      MaximumBatchingWindowInSeconds: metadata.sqs.batchWindow, // Integer
      ...(metadata.sqs.maximumConcurrency && {
        ScalingConfig: {
          MaximumConcurrency: metadata.sqs.maximumConcurrency, // Integer
        },
      }),

      EventSourceArn: metadata.sqs.arn,

      // targetAlias.logicalId - Alias not currently used, so not supported yet
      FunctionName: {
        'Fn::GetAtt': [
          `${normalizeResourceName(metadata.function.key)}LambdaFunction`,
          'Arn',
        ],
      },

      FilterCriteria: metadata.sqs.filterPatterns ? {
        Filters: metadata.sqs.filterPatterns.map((pattern) => ({
          Pattern: JSON.stringify(pattern),
        })),
      } : undefined,

      FunctionResponseTypes: metadata.sqs.functionResponseType ? [metadata.sqs.functionResponseType] : undefined, // [ String, ... ]
    },
  },
});

const queueName = (sqs) => { // eslint-disable-line no-shadow
  if (sqs.arn['Fn::GetAtt']) {
    return sqs.arn['Fn::GetAtt'][0];
  } else if (sqs.arn['Fn::ImportValue']) {
    return sqs.arn['Fn::ImportValue'];
  } else if (sqs.arn.Ref) {
    return sqs.arn.Ref;
  } else if (sqs.arn['Fn::Join']) {
    // [0] is the used delimiter, [1] is the array with values
    return sqs.arn['Fn::Join'][1].slice(-1).pop();
  }
  return sqs.arn.split(':').pop();
};
