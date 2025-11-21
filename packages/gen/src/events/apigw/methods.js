import {
  normalizeName,
  normalizeResourceName,
} from '../../utils';

import {
  getResourceLogicalId,
  normalizePath,
} from './resources';

export default (metadata, convivio, ctx) => {
  ctx.resourceId = getResourceLogicalId(metadata.http.path);
  ctx.resourceName = normalizePath(metadata.http.path);
  ctx.methodName = metadata.http.method;
  ctx.methodLogicalId = `ApiGatewayMethod${ctx.resourceName}${normalizeMethodName(ctx.methodName.toLowerCase())}`;
  ctx.lambdaLogicalId = `${normalizeResourceName(metadata.function.key)}LambdaFunction`;
  ctx.apiGatewayPermission = `${normalizeResourceName(metadata.function.key)}LambdaPermissionApiGateway`;

  const authorizer = getMethodAuthorization(metadata, ctx);

  return {
    Resources: {
      [ctx.methodLogicalId]: {
        Type: 'AWS::ApiGateway::Method',
        DependsOn: [ctx.apiGatewayPermission, ...authorizer.DependsOn],
        Properties: {
          ApiKeyRequired: metadata.http.private || false,
          ...authorizer.Properties,
          HttpMethod: metadata.http.method.toUpperCase(),
          Integration: getMethodIntegration(metadata.http, {
            lambdaLogicalId: ctx.lambdaLogicalId,
            lambdaAliasName: ctx.lambdaAliasName,
          }),
          ResourceId: { Ref: ctx.resourceId },
          RestApiId: {
            Ref: ctx.restApiLogicalId,
          },
        },
      },
    },
  };
};

const normalizeMethodName = (methodName) => normalizeName(methodName.toLowerCase());

const getMethodIntegration = (http, { lambdaLogicalId, lambdaAliasName }) => {
  const type = http.integration || 'AWS_PROXY';
  const integration = {
    IntegrationHttpMethod: 'POST',
    Type: type,
    Uri: {
      'Fn::Join': [
        '',
        [
          'arn:',
          { Ref: 'AWS::Partition' },
          ':apigateway:',
          { Ref: 'AWS::Region' },
          ':lambda:path/2015-03-31/functions/',
          ...[],
          { 'Fn::GetAtt': [lambdaLogicalId, 'Arn'] },
          ...(lambdaAliasName ? [':', lambdaAliasName] : []),
          '/invocations',
        ],
      ],
    },
  };

  return integration;
};

const extractAuthorizerNameFromArn = (functionArn) => {
  const splitArn = functionArn.split(':');
  const splitName = splitArn[splitArn.length - 1].split('-');
  return splitName[splitName.length - 1];
};

const getMethodAuthorization = ({ http }, ctx) => {
  if (http.authorizer?.type === 'AWS_IAM') {
    return {
      Properties: {
        AuthorizationType: 'AWS_IAM',
      },
      DependsOn: [],
    };
  }

  if (http.authorizer) {
    // local authorizer function
    if (!http.authorizer.name && !http.authorizer.arn) {
      http.authorizer = {
        name: http.authorizer,
        arn: {
          'Fn::GetAtt': [
            `${normalizeResourceName(http.authorizer)}LambdaFunction`,
            'Arn'
          ]
        }
      };
    }

    // external authorizer function
    if (!http.authorizer.name && http.authorizer.arn) {
      http.authorizer.name = extractAuthorizerNameFromArn(http.authorizer.arn);
    }
    ctx.authorizerLogicalId = `${normalizeResourceName(http.authorizer.name)}ApiGatewayAuthorizer`;

    return {
      Properties: {
        AuthorizationType: 'CUSTOM',
        AuthorizerId: { Ref: ctx.authorizerLogicalId },
      },
      DependsOn: [ctx.authorizerLogicalId],
    };
  }

  return {
    Properties: {
      AuthorizationType: 'NONE',
    },
    DependsOn: [],
  };
};
