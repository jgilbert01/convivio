import _ from 'lodash';

export default (metadata, convivio, ctx) => {
  const apiGatewayResources = getResources(metadata);
  return {
    Resources: apiGatewayResources.reduce((a, c) => ({
      ...a,
      [c.resourceLogicalId]: {
        Type: 'AWS::ApiGateway::Resource',
        Properties: {
          ParentId: c.parentRef,
          PathPart: c.pathPart,
          RestApiId: { Ref: ctx.restApiLogicalId },
        },
      },
    }), {}),
  };
};

const getResources = (metadata) => {
  const path = metadata.http.path.replace(/^\//, '').replace(/\/$/, '');
  const pathParts = path.split('/');

  return pathParts.map((pathPart, i) => {
    const resourceLogicalId = getResourceLogicalId(pathParts.slice(0, i + 1).join('/'));
    return {
      resourceLogicalId,
      parentRef: i ? {
        Ref: getResourceLogicalId(pathParts.slice(0, i).join('/')),
      } : {
        'Fn::GetAtt': [
          'ApiGatewayRestApi',
          'RootResourceId',
        ],
      },
      pathPart,
    };
  });
};

export const getResourceLogicalId = (resourcePath) => `ApiGatewayResource${normalizePath(resourcePath)}`;

export const normalizePath = (resourcePath) => resourcePath.split('/').map(normalizePathPart).join('');

export const normalizePathPart = (rawPath) => _.upperFirst(
  _.capitalize(rawPath)
    .replace(/-/g, 'Dash')
    .replace(/\{(.*)\}/g, '$1Var')
    .replace(/[^0-9A-Za-z]/g, ''),
);
