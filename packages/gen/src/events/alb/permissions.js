export default (metadata, convivio, ctx) => {
  ctx.albPermissionLogicalId = `${ctx.functionName}LambdaPermissionAlb`;
  ctx.registerTargetPermissionLogicalId = `${ctx.functionName}LambdaPermissionRegisterTarget`;

  //       const { targetAlias } = this.serverless.service.functions[functionName];
  //       if (targetAlias) {
  //         albInvokePermission.DependsOn = [targetAlias.logicalId];
  //       }

  const FunctionName = {
    'Fn::GetAtt': [
      `${ctx.functionName}LambdaFunction`,
      'Arn'],
  };
  const Action = 'lambda:InvokeFunction';
  const Principal = 'elasticloadbalancing.amazonaws.com';

  return {
    Resources: {
      [ctx.albPermissionLogicalId]: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName,
          Action,
          Principal,
          SourceArn: {
            Ref: ctx.albTargetGroupLogicalId,
          },
        },
      },
      [ctx.registerTargetPermissionLogicalId]: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName,
          Action,
          Principal,
        },
      },
    },
  };
};
