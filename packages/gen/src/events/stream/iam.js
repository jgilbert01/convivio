export default (metadata, convivio) => {
  const statements = convivio.json.Resources
    .IamRoleLambdaExecution.Properties.Policies[0].PolicyDocument.Statement;

  if (metadata.stream.type === 'dynamodb') {
    statements.push({
      Effect: 'Allow',
      Action: [
        'dynamodb:GetRecords',
        'dynamodb:GetShardIterator',
        'dynamodb:DescribeStream',
        'dynamodb:ListStreams',
      ],
      Resource: [metadata.stream.arn],
    });
  }

  if (metadata.stream.type === 'kinesis') {
    statements.push({
      Effect: 'Allow',
      Action: [
        'kinesis:GetRecords',
        'kinesis:GetShardIterator',
        'kinesis:DescribeStream',
        'kinesis:DescribeStreamSummary',
        'kinesis:ListShards',
        'kinesis:ListStreams',
      ],
      Resource: [metadata.stream.arn],
    });
    if (metadata.stream.consumer) {
      statements.push({
        Effect: 'Allow',
        Action: ['kinesis:SubscribeToShard'],
        Resource: [
          metadata.stream.consumer,
          // {
          //   Ref: 'consumerLogicalId',
          // },
        ],
      });
    }
  }

  if (metadata.stream.destinations) {
    const destinationType = metadata.stream.destinations.onFailure.type
      || metadata.stream.destinations.OnFailureDestinationArn.split(':')[2];

    statements.push({
      Effect: 'Allow',
      Action: destinationType === 'sns'
        ? ['sns:Publish']
        : ['sqs:ListQueues', 'sqs:SendMessage'],
      Resource: [metadata.stream.destinations.OnFailureDestinationArn],
    });
  }
};
