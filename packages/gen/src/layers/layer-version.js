import path from 'path';
import { getArtifactDirectoryName, normalizeResourceName } from '../utils';

export const layerLogicalId = (key) => `${normalizeResourceName(key)}LambdaLayer`;

export default (metadata, convivio) => {
  const logicalId = layerLogicalId(metadata.key);
  const retain = metadata.retain ? 'Retain' : undefined;

  return {
    Resources: {
      [logicalId]: {
        Type: 'AWS::Lambda::LayerVersion',
        DeletionPolicy: retain,
        UpdateReplacePolicy: retain,
        Properties: {
          Content: {
            S3Bucket: convivio.yaml.provider.deploymentBucket.name,
            S3Key: `${getArtifactDirectoryName(convivio)}/${metadata.package.artifact.split(path.sep).pop()}`,
          },
          LayerName: metadata.name,
          Description: metadata.description,
          CompatibleRuntimes: metadata.compatibleRuntimes,
          CompatibleArchitectures: metadata.compatibleArchitectures,
          LicenseInfo: metadata.licenseInfo,
        },
      },
      ...permissions(logicalId, metadata),
    },
    Outputs: {
      [`${logicalId}QualifiedArn`]: {
        Description: 'Current Lambda layer version',
        Value: { Ref: logicalId },
        Export: { Name: `${convivio.yaml.service}-${convivio.options.stage}-${logicalId}QualifiedArn` },
      },
    },
  };
};

const permissions = (logicalId, metadata) => (metadata.allowedAccounts || [])
  .reduce((a, account) => ({
    ...a,
    [`${logicalId}Permission${account === '*' ? 'All' : account}`]: {
      Type: 'AWS::Lambda::LayerVersionPermission',
      DeletionPolicy: metadata.retain ? 'Retain' : undefined,
      Properties: {
        Action: 'lambda:GetLayerVersion',
        LayerVersionArn: { Ref: logicalId },
        Principal: account,
      },
    },
  }), {});
