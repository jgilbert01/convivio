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

  // this.provider.naming.getMethodLogicalId(
  //   normalizeName(methodName.toLowerCase()),
  //   metadata.http.method
  // );
  // const getMethodLogicalId = (resourceId, methodName) => {
  //   return `ApiGatewayMethod${resourceId}${this.normalizeMethodName(methodName)}`;
  // };

  ctx.lambdaLogicalId = `${normalizeResourceName(metadata.function.key)}LambdaFunction`;
  // ctx.lambdaAliasName = metadata.targetAlias && metadata.targetAlias.name;
  // const lambdaAliasLogicalId =
  //   metadata.targetAlias && metadata.targetAlias.logicalId;
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

          // MethodResponses:
          //   - MethodResponse
          // OperationName: String
          // RequestModels:
          //   Key: Value
          // RequestParameters:
          //   Key: Value
          // RequestValidatorId: String

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

// getLambdaApiGatewayPermissionLogicalId(functionName) {
//   return `${this.getNormalizedResourceName(functionName)}LambdaPermissionApiGateway`;
// },

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
  // TODO the following two lines assumes default function naming?  Is there a better way?
  // TODO (see ~/lib/classes/service.js:~155)
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
    // if (http.authorizer.type && http.authorizer.authorizerId) {
    //   const authorizationType = (
    //     http.authorizer.type.toUpperCase() === 'TOKEN'
    //     || http.authorizer.type.toUpperCase() === 'REQUEST'
    //   )
    //     ? 'CUSTOM'
    //     : http.authorizer.type;

    //   return {
    //     // Properties: {
    //     AuthorizationType: authorizationType,
    //     AuthorizerId: http.authorizer.authorizerId,
    //     AuthorizationScopes: (
    //       http.authorizer.type.toUpperCase() === 'COGNITO_USER_POOLS'
    //       && http.authorizer.scopes
    //       && http.authorizer.scopes.length
    //     )
    //       ? http.authorizer.scopes
    //       : undefined,
    //     // },
    //   };
    // }

    if (!http.authorizer.name && http.authorizer.arn) {
      http.authorizer.name = extractAuthorizerNameFromArn(http.authorizer.arn);
    }
    // if (http.authorizer.name && !http.authorizer.arn) {
    //   http.authorizer.arn = extractAuthorizerNameFromArn(http.authorizer.arn);
    //   // if (authorizerFunctionName) {
    //   //   const authorizerFunctionObj = this.serverless.service.getFunction(authorizerFunctionName);
    //   //   arn = resolveLambdaTarget(authorizerFunctionName, authorizerFunctionObj);
    //   //   if (authorizerFunctionObj.targetAlias) {
    //   //     logicalId = authorizerFunctionObj.targetAlias.logicalId;
    //   //   }
    //   // }
    // }

    // const authorizerLogicalId = ''; // this.provider.naming.getAuthorizerLogicalId(http.authorizer.name);
    ctx.authorizerLogicalId = `${normalizeResourceName(http.authorizer.name)}ApiGatewayAuthorizer`;

    // const authorizerArn = http.authorizer.arn;

    // const authorizationType = 'CUSTOM';
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

// module.exports = {
//   compileMethods() {
//     this.permissionMapping = [];

//     this.validated.events.forEach((event) => {
//       const resourceId = this.getResourceId(event.http.path);
//       const resourceName = this.getResourceName(event.http.path);

//       const requestParameters = {};
//       if (event.http.request && event.http.request.parameters) {
//         Object.entries(event.http.request.parameters).forEach(([key, value]) => {
//           requestParameters[key] = (() => {
//             if (!_.isObject(value)) return value;
//             return value.required != null ? value.required : true;
//           })();
//         });
//       }

//       const apiGatewayPermission = this.provider.naming.getLambdaApiGatewayPermissionLogicalId(
//         event.functionName
//       );
//       const template = {
//         Type: 'AWS::ApiGateway::Method',
//         Properties: {
//           HttpMethod: event.http.method.toUpperCase(),
//           RequestParameters: requestParameters,
//           ResourceId: resourceId,
//           RestApiId: this.provider.getApiGatewayRestApiId(),
//           OperationName: event.http.operationId,
//         },
//         DependsOn: [apiGatewayPermission],
//       };

//       if (event.http.private) {
//         template.Properties.ApiKeyRequired = true;
//       } else {
//         template.Properties.ApiKeyRequired = false;
//       }

//       const methodLogicalId = this.provider.naming.getMethodLogicalId(
//         resourceName,
//         event.http.method
//       );

//       const lambdaLogicalId = this.provider.naming.getLambdaLogicalId(event.functionName);
//       const functionObject = this.serverless.service.functions[event.functionName];
//       const lambdaAliasName = functionObject.targetAlias && functionObject.targetAlias.name;
//       const lambdaAliasLogicalId =
//         functionObject.targetAlias && functionObject.targetAlias.logicalId;

//       const singlePermissionMapping = {
//         resourceName,
//         lambdaLogicalId,
//         lambdaAliasName,
//         lambdaAliasLogicalId,
//         event,
//       };
//       this.permissionMapping.push(singlePermissionMapping);

//       _.merge(
//         template,
//         this.getMethodAuthorization(event.http),
//         this.getMethodIntegration(event.http, {
//           lambdaLogicalId,
//           lambdaAliasName,
//         }),
//         this.getMethodResponses(event.http)
//       );

//       let extraCognitoPoolClaims;
//       if (event.http.authorizer) {
//         const claims = event.http.authorizer.claims || [];
//         extraCognitoPoolClaims = claims.map((claim) => {
//           if (typeof claim === 'string') {
//             const colonIndex = claim.indexOf(':');
//             if (colonIndex !== -1) {
//               const subClaim = claim.substring(colonIndex + 1);
//               return `"${subClaim}": "$context.authorizer.claims['${claim}']"`;
//             }
//           }
//           return `"${claim}": "$context.authorizer.claims.${claim}"`;
//         });
//       }
//       const requestTemplates = template.Properties.Integration.RequestTemplates;
//       if (requestTemplates) {
//         Object.entries(requestTemplates).forEach(([key, value]) => {
//           let claimsString = '';
//           if (extraCognitoPoolClaims && extraCognitoPoolClaims.length > 0) {
//             claimsString = extraCognitoPoolClaims.join(',').concat(',');
//           }
//           requestTemplates[key] = value.replace('extraCognitoPoolClaims', claimsString);
//         });
//       }

//       this.apiGatewayMethodLogicalIds.push(methodLogicalId);

//       _.merge(this.serverless.service.provider.compiledCloudFormationTemplate.Resources, {
//         [methodLogicalId]: template,
//       });
//     });
//   },
// };
