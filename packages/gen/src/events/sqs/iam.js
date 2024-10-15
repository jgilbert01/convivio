export default (metadata, convivio) => {
  const statements = convivio.json.Resources
    .IamRoleLambdaExecution.Properties.Policies[0].PolicyDocument.Statement;

  statements.push({
    Effect: 'Allow',
    Action: [
      'sqs:ReceiveMessage',
      'sqs:DeleteMessage',
      'sqs:GetQueueAttributes',
    ],
    Resource: [metadata.sqs.arn],
  });
};
