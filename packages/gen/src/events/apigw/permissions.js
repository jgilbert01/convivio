import {
  normalizeResourceName,
} from '../../utils';

export default (metadata, convivio, ctx) => {
  ctx.lambdaPermissionLogicalId = `${normalizeResourceName(metadata.function.key)}LambdaPermissionApiGateway`;
  ctx.functionArnGetter = { 'Fn::GetAtt': [ctx.lambdaLogicalId, 'Arn'] };

  ctx.authorizerPermissionLogicalId = getAuthorizerLogicalId(metadata, convivio);

  const Action = 'lambda:InvokeFunction';
  const Principal = 'apigateway.amazonaws.com';
  const SourceArn = {
    'Fn::Join': [
      '',
      [
        'arn:',
        { Ref: 'AWS::Partition' },
        ':execute-api:',
        { Ref: 'AWS::Region' },
        ':',
        { Ref: 'AWS::AccountId' },
        ':',
        { Ref: ctx.restApiLogicalId },
        '/*/*',
      ],
    ],
  };

  return {
    Resources: {
      [ctx.lambdaPermissionLogicalId]: {
        Type: 'AWS::Lambda::Permission',
        // DependsOn: lambdaAliasLogicalId || undefined,
        Properties: {
          FunctionName: ctx.functionArnGetter,
          //   FunctionName: ctx.lambdaAliasName
          //     ? { 'Fn::Join': [':', [ctx.functionArnGetter, ctx.lambdaAliasName]] }
          //     : ctx.functionArnGetter,
          Action,
          Principal,
          SourceArn,
        },
      },
      ...(ctx.authorizerPermissionLogicalId ? {
        [ctx.authorizerPermissionLogicalId]: {
          Type: 'AWS::Lambda::Permission',
          Properties: {
            FunctionName: metadata.http.authorizer.logicalId ? { Ref: metadata.http.authorizer.logicalId } : metadata.http.authorizer.arn,
            Action,
            Principal,
            SourceArn,
          },
        },
      } : {}),
    },
  };
};

const getAuthorizerLogicalId = (metadata, convivio) => {
  if (metadata.http.authorizer?.arn) {
    const { authorizer } = metadata.http;
    // if (!authorizer.name) authorizer.name = extractAuthorizerNameFromArn(authorizer.arn);
    const authorizerPermissionLogicalId = `${normalizeResourceName(authorizer.name)}LambdaPermissionApiGateway`;

    if (convivio.json[authorizerPermissionLogicalId]) return undefined;
    if (authorizer.managedExternally) return undefined;

    if (
      (authorizer.type || '').toUpperCase() === 'COGNITO_USER_POOLS'
      // || (typeof authorizer.arn === 'string'
      //   && awsArnRegExs.cognitoIdpArnExpr.test(authorizer.arn))
    ) {
      return undefined;
    }

    return authorizerPermissionLogicalId;
  }

  return undefined;
};
