import {
  get,
  normalizeNameToAlphaNumericOnly,
  normalizeResourceName,
} from '../../utils';

export default (metadata, convivio) => ({
  Resources: {
    ...stream(metadata, convivio),
    // ...consumer(metadata, convivio),
  },
});

const stream = (metadata, convivio) => ({
  [`${normalizeResourceName(metadata.function.key)}EventSourceMapping${normalizeResourceName(metadata.stream.type)}${normalizeNameToAlphaNumericOnly(streamName(metadata.stream, convivio))}`]: {
    Type: 'AWS::Lambda::EventSourceMapping',
    DependsOn: [
      'IamRoleLambdaExecution',
      // targetAlias.logicalId - Alias not currently used, so not supported yet
      // consumerLogicalId
      ...[...(metadata.stream.consumer ? [metadata.stream.consumer.Ref] : [])],
    ],
    Properties: {
      BatchSize: get(metadata.stream, convivio, 'batchSize', 10), // max 100
      Enabled: metadata.stream.enabled || true,
      StartingPosition: get(metadata.stream, convivio, 'startingPosition', 'TRIM_HORIZON'),
      // StartingPositionTimestamp : Number, // TODO calculate offset

      BisectBatchOnFunctionError: metadata.stream.bisectBatchOnFunctionError, // Boolean
      MaximumBatchingWindowInSeconds: metadata.stream.batchWindow, // Integer
      MaximumRecordAgeInSeconds: metadata.stream.maximumRecordAgeInSeconds, // Integer
      MaximumRetryAttempts: metadata.stream.maximumRetryAttempts, // Integer
      ParallelizationFactor: metadata.stream.parallelizationFactor, // Integer 1-10
      TumblingWindowInSeconds: metadata.stream.tumblingWindowInSeconds, // Integer

      EventSourceArn: metadata.stream.consumer || metadata.stream.arn,
      // EventSourceArn: metadata.stream.consumer === true
      //   ? {
      //     Ref: 'consumerLogicalId',
      //   }
      //   : metadata.stream.arn,

      // targetAlias.logicalId - Alias not currently used, so not supported yet
      FunctionName: {
        'Fn::GetAtt': [
          `${normalizeResourceName(metadata.function.key)}LambdaFunction`,
          'Arn',
        ],
      },

      FilterCriteria: metadata.stream.filterPatterns ? {
        Filters: metadata.stream.filterPatterns.map((pattern) => ({
          Pattern: JSON.stringify(pattern),
        })),
      } : undefined,

      DestinationConfig: destinationConfig(metadata.stream),

      // KmsKeyArn : String,

      // FunctionResponseTypes: metadata.stream.functionResponseType ? [metadata.stream.functionResponseType] : undefined, // [ String, ... ]
    },
  },
});

// const consumer = (metadata, convivio) => {
//   if (!metadata.stream.consumer) return {};

//   const ConsumerName = `${metadata.function.key}${streamName(metadata.stream, convivio)}Consumer`;
//   return ({
//     [`${normalizeResourceName(ConsumerName)}StreamConsumer`]: {
//       Type: 'AWS::Kinesis::StreamConsumer',
//       Properties: {
//         StreamARN: metadata.stream.arn,
//         ConsumerName,
//       },
//     },
//     //     if (Array.isArray(streamResource.DependsOn)) {
//     //       streamResource.DependsOn.push(consumerLogicalId);
//     //     } else {
//     //       streamResource.DependsOn = [streamResource.DependsOn, consumerLogicalId];
//     //     }
//     //     const consumerArnRef = {
//     //       Ref: consumerLogicalId,
//     //     };
//     //     streamResource.Properties.EventSourceArn = consumerArnRef;
//     //     kinesisConsumerStatement.Resource.push(consumerArnRef);
//     //   } else {
//     //     const consumerArn = event.stream.consumer;
//     //     streamResource.Properties.EventSourceArn = consumerArn;
//     //     kinesisConsumerStatement.Resource.push(consumerArn);
//     //   }
//     // }
//   });
// };

const streamName = (stream) => { // eslint-disable-line no-shadow
  if (stream.arn['Fn::GetAtt']) {
    return stream.arn['Fn::GetAtt'][0];
  } else if (stream.arn['Fn::ImportValue']) {
    return stream.arn['Fn::ImportValue'];
  } else if (stream.arn.Ref) {
    return stream.arn.Ref;
  } else if (stream.arn['Fn::Join']) {
    // [0] is the used delimiter, [1] is the array with values
    const name = stream.arn['Fn::Join'][1].slice(-1).pop();
    if (name.split('/').length) {
      return name.split('/').pop();
    }
    return name;
  }
  return stream.arn.split('/')[1];
};

// const resolveLambdaTarget = memoizee((functionName, functionObject) => {
//   const lambdaLogicalId = naming.getLambdaLogicalId(functionName);
//   const functionArnGetter = { 'Fn::GetAtt': [lambdaLogicalId, 'Arn'] };
//   if (!functionObject.targetAlias) return functionArnGetter;
//   return { 'Fn::Join': [':', [functionArnGetter, functionObject.targetAlias.name]] };
// });

const destinationConfig = (stream) => { // eslint-disable-line no-shadow
  if (!stream.destinations) return undefined;

  if (typeof stream.destinations.onFailure === 'object') {
    stream.destinations.OnFailureDestinationArn = stream.destinations.onFailure.arn;
  } else {
    stream.destinations.OnFailureDestinationArn = stream.destinations.onFailure;
  }

  return {
    OnFailure: {
      Destination: stream.destinations.OnFailureDestinationArn,
    },
  };
};
