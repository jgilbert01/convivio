import path from 'path';
import {
  get,
  getArtifactDirectoryName,
  normalizeName,
  normalizeResourceName,
} from '../utils';

export default (metadata, convivio) => ({
  Resources: {
    [`${normalizeResourceName(metadata.key)}LambdaFunction`]: {
      Type: 'AWS::Lambda::Function',
      DependsOn: [
        `${normalizeName(metadata.key)}LogGroup`,
      ],
      //   if (functionObject.dependsOn) {
      //     functionResource.DependsOn = (functionResource.DependsOn || []).concat(
      //       functionObject.dependsOn
      //     );
      //   }

      Condition: metadata.condition,
      Properties: {
        Code: convivio.yaml.provider.deploymentBucket ? { // TODO and exists - TemplateURL ???
          S3Bucket: convivio.yaml.provider.deploymentBucket.name,
          S3Key: `${getArtifactDirectoryName(convivio)}/${metadata.package.artifact.split(path.sep).pop()}`,
        } : undefined, // TODO
        FunctionName: metadata.name,
        Description: metadata.description,
        Handler: metadata.handler,
        Runtime: get(metadata, convivio, 'runtime', 'nodejs20.x'),
        MemorySize: get(metadata, convivio, 'memorySize', 1024),
        Timeout: get(metadata, convivio, 'timeout', 6),
        Architectures: architectures(get(metadata, convivio, 'architecture')),
        Environment: environment(metadata, convivio),
        KmsKeyArn: get(metadata, convivio, 'kmsKeyArn'), // String,
        Role: role(metadata, convivio),
        ReservedConcurrentExecutions: metadata.reservedConcurrency, // Integer
        TracingConfig: tracingConfig(metadata, convivio),
        VpcConfig: vpcConfig(get(metadata, convivio, 'vpc')),

        //         CodeSigningConfigArn : String,
        //         DeadLetterConfig : DeadLetterConfig,
        //         EphemeralStorage : EphemeralStorage,
        //         FileSystemConfigs : [ FileSystemConfig, ... ],
        //         ImageConfig : ImageConfig,
        //         Layers : [ String, ... ],
        //         LoggingConfig : LoggingConfig,
        //         PackageType : String,
        //         RecursiveLoop : String,
        //         RuntimeManagementConfig : RuntimeManagementConfig,
        //         SnapStart : SnapStart,
        //         Tags : [ Tag, ... ],
      },
    },
  },
  Outputs: {
    // [`${normalizeResourceName(metadata.key)}LambdaFunctionQualifiedArn]: {
    //     Description: 'Current Lambda function version',
    //     Value: {
    //       Ref: `${normalizeResourceName(metadata.key)}LambdaVersion${bWot86ej7yi1NyL9hu71JUcX6wr9n3nKduKC0BknF8}`
    //     },
    //     Export: {
    //       Name: `${metadata.name}-${normalizeResourceName(metadata.key)}LambdaFunctionQualifiedArn`
    //     }
    //   },
  },
  // Conditions: {
  // metadata.condition
  // },
});

const architectures = (architecture) => (architecture ? [architecture] : undefined);

const environment = (metadata, convivio) => (metadata.environment || convivio.yaml.provider.environment
  ? {
    Variables: {
      ...(convivio.yaml.provider.environment || {}),
      ...(metadata.environment || {}),
    },
  }
  : undefined);

const role = () => ({
  'Fn::GetAtt': [
    'IamRoleLambdaExecution',
    'Arn',
  ],
});
// const role = this.provider.getCustomExecutionRole(functionObject);
// this.compileRole(functionResource, role || 'IamRoleLambdaExecution');

const vpcConfig = (vpc) => (vpc ? {
  SecurityGroupIds: vpc.securityGroupIds,
  SubnetIds: vpc.subnetIds,
} : undefined);

const tracingConfig = (metadata, convivio) => {
  const tracing = metadata.tracing || convivio.yaml.provider.tracing?.lambda;

  if (tracing) {
    return {
      Mode: typeof tracing === 'boolean' ? 'Active' : tracing,
    };
  }

  return undefined;
};
