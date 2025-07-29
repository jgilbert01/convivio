export default (convivio, ctx) => {
  const apiGateway = convivio.yaml.provider.apiGateway || {};

  // immediately return if we're using an external REST API id
  //   if (apiGateway.restApiId) return;

  ctx.restApiLogicalId = 'ApiGatewayRestApi';
  return {
    Resources: {
      [ctx.restApiLogicalId]: {
        Type: 'AWS::ApiGateway::RestApi',
        Properties: {
          ApiKeySourceType: apiGateway?.apiKeySourceType?.toUpperCase(),
          BinaryMediaTypes: apiGateway?.binaryMediaTypes,
          //   Description: String
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
          //   Tags:
          //     - Tag

          //   Body: Json
          //   BodyS3Location:
          //     S3Location
          //   CloneFrom: String
          //   FailOnWarnings: Boolean
          //   Mode: String
          //   Parameters:
          //     Key: Value
        },
      },
    },
  };
};
