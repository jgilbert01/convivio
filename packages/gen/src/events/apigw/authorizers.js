import {
  normalizeResourceName,
} from '../../utils';

export default (metadata, convivio, ctx) => {
  const { authorizer } = metadata.http;
  if (!authorizer) return {};

  if (!authorizer.name) authorizer.name = extractAuthorizerNameFromArn(authorizer.arn);
  ctx.authorizerLogicalId = `${normalizeResourceName(authorizer.name)}ApiGatewayAuthorizer`;

  return {
    Resources: {
      [ctx.authorizerLogicalId]: {
        Type: 'AWS::ApiGateway::Authorizer',
        Properties: {
          AuthorizerResultTtlInSeconds: authorizer.resultTtlInSeconds || 300,
          AuthorizerUri: {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':apigateway:',
                { Ref: 'AWS::Region' },
                ':lambda:path/2015-03-31/functions/',
                authorizer.arn,
                '/invocations',
              ],
            ],
          },
          IdentitySource: authorizer.identitySource || 'method.request.header.Authorization',
          Name: authorizer.name,
          RestApiId: {
            Ref: ctx.restApiLogicalId,
          },
          Type: authorizer.type ? authorizer.type.toUpperCase() : 'TOKEN',
        },
      },
    },
  };
};

const extractAuthorizerNameFromArn = (functionArn) => {
  const splitArn = functionArn.split(':');
  const splitName = splitArn[splitArn.length - 1].split('-');
  return splitName[splitName.length - 1];
};
