export default (convivio, ctx) => {
  const apiGateway = convivio.yaml.provider.apiGateway || {};

  ctx.restApiLogicalId = 'ApiGatewayRestApi';
  return {
    Resources: {
      [ctx.restApiLogicalId]: {
        Type: 'AWS::ApiGateway::RestApi',
        Properties: {
          ApiKeySourceType: apiGateway?.apiKeySourceType?.toUpperCase(),
          BinaryMediaTypes: apiGateway?.binaryMediaTypes,
          DisableExecuteApiEndpoint: apiGateway?.disableDefaultEndpoint,
          EndpointConfiguration: {
            Types: [convivio.yaml.provider.endpointType?.toUpperCase() || 'REGIONAL'],
            VpcEndpointIds: convivio.yaml.provider.vpcEndpointIds,
          },
          MinimumCompressionSize: apiGateway?.minimumCompressionSize,
          Name: convivio.yaml.provider.apiName || (apiGateway?.shouldStartNameWithService
            ? `${convivio.yaml.service}-${convivio.options.stage}`
            : `${convivio.options.stage}-${convivio.yaml.service}`),
          Policy: apiGateway?.resourcePolicy ? {
            Version: '2012-10-17',
            Statement: apiGateway.resourcePolicy,
          } : '',
        },
      },
    },
  };
};
