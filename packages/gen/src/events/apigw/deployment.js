export default (convivio, ctx) => {
  const apiGateway = convivio.yaml.provider.apiGateway || {};

  return {
    Resources: {
      [`ApiGatewayDeployment${convivio.instanceId}`]: {
        Type: 'AWS::ApiGateway::Deployment',
        Properties: {
          Description: apiGateway?.description,
          RestApiId: {
            Ref: ctx.restApiLogicalId,
          },
          StageName: convivio.options.stage,
          //  StageDescription:
          //  DeploymentCanarySettings:
        },
        DependsOn: ctx.apiGatewayMethodLogicalIds,
      },
    },
    Outputs: {
      ServiceEndpoint: {
        Description: 'URL of the service endpoint',
        Value: {
          'Fn::Join': [
            '',
            [
              'https://',
              {
                Ref: ctx.restApiLogicalId,
              },
              '.execute-api.',
              { Ref: 'AWS::Region' },
              '.',
              { Ref: 'AWS::URLSuffix' },
              `/${convivio.options.stage}`,
            ],
          ],
        },
      },
    },
  };
};
