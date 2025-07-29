import {
  normalizeResourceName,
} from '../../utils';

export default (metadata, convivio, ctx) => {
  const { authorizer } = metadata.http;
  if (!authorizer) return;

  if (!authorizer.name) authorizer.name = extractAuthorizerNameFromArn(authorizer.arn);
  // ctx.lambdaPermissionLogicalId = `${normalizeResourceName(metadata.function.key)}LambdaPermissionApiGateway`;
  ctx.authorizerLogicalId = `${normalizeResourceName(authorizer.name)}ApiGatewayAuthorizer`;

  return {
    Resources: {
      [ctx.authorizerLogicalId]: {
        Type: 'AWS::ApiGateway::Authorizer',
        Properties: {
          AuthorizerResultTtlInSeconds: authorizer.resultTtlInSeconds || 300,
          //   resultTtlInSeconds = Number.parseInt(authorizer.resultTtlInSeconds, 10);
          //   resultTtlInSeconds = Number.isNaN(resultTtlInSeconds) ? 300 : resultTtlInSeconds;
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
  // TODO the following two lines assumes default function naming?  Is there a better way?
  // TODO (see ~/lib/classes/service.js:~155)
  const splitName = splitArn[splitArn.length - 1].split('-');
  return splitName[splitName.length - 1];
};

// const _ = require('lodash');
// const awsArnRegExs = require('../../../../../utils/arn-regular-expressions');

//       if (event.http.authorizer && event.http.authorizer.arn) {
//         const { authorizer } = event.http;

//         if (typeof authorizer.identityValidationExpression === 'string') {
//           Object.assign(authorizerProperties, {
//             IdentityValidationExpression: authorizer.identityValidationExpression,
//           });
//         }

//         const authorizerLogicalId = this.provider.naming.getAuthorizerLogicalId(authorizer.name);

//         if (
//           (authorizer.type || '').toUpperCase() === 'COGNITO_USER_POOLS'
//           || (typeof authorizer.arn === 'string'
//             && awsArnRegExs.cognitoIdpArnExpr.test(authorizer.arn))
//         ) {
//           authorizerProperties.Type = 'COGNITO_USER_POOLS';
//           authorizerProperties.ProviderARNs = [authorizer.arn];
//         } else {
//         }
//       }
//     });
//   },
// };
