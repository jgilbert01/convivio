import crypto from 'crypto';
import fs from 'fs';
import _ from 'lodash';

export const getArtifactDirectoryName = (convivio) => {
  const date = new Date();
  const serviceStage = `${convivio.service.service}/${this.provider.getStage()}`;
  const dateString = `${date.getTime().toString()}-${date.toISOString()}`;
  const prefix = convivio.yaml.provider?.deploymentPrefix || 'convivio';
  return `${prefix}/${serviceStage}/${dateString}`;
};

export const createFileHash = (data) => crypto
  .createHash('sha256')
  .update(data)
  .digest('base64');

export const readFile = (path) => fs.readFileSync(path);

export const getFileStats = (filepath) => {
  try {
    return fs.promise.stat(filepath);
  } catch (error) {
    throw new Error(
      `Cannot read file artifact "${filepath}": ${error.message}`
    );
  }
};

export const deepSortObjectByKey = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(deepSortObjectByKey);
  }

  if (_.isPlainObject(obj)) {
    return _.fromPairs(
      Object.entries(obj)
        .sort(([key], [otherKey]) => key.localeCompare(otherKey))
        .map(([key, value]) => [key, deepSortObjectByKey(value)])
    );
  }

  return obj;
};

export const normalizeCloudFormationTemplate = (template) => {
  const normalizedTemplate = _.cloneDeep(template);

  Object.entries(normalizedTemplate.Resources).forEach(([key, value]) => {
    // if (key.startsWith('ApiGatewayDeployment')) {
    //   delete Object.assign(normalizedTemplate.Resources, {
    //     ApiGatewayDeployment: normalizedTemplate.Resources[key],
    //   })[key];
    // }

    // if (key.startsWith('WebsocketsDeployment') && key !== 'WebsocketsDeploymentStage') {
    //   delete Object.assign(normalizedTemplate.Resources, {
    //     WebsocketsDeployment: normalizedTemplate.Resources[key],
    //   })[key];
    // }

    // if (key === 'WebsocketsDeploymentStage' && _.get(value.Properties, 'DeploymentId')) {
    //   const newVal = value;
    //   newVal.Properties.DeploymentId.Ref = 'WebsocketsDeployment';
    // }

    // if (value.Type && value.Type === 'AWS::Lambda::Function' && _.get(value.Properties, 'Code')) {
    //   const newVal = value;
    //   newVal.Properties.Code.S3Key = '';
    // }

    // if (
    //   value.Type &&
    //   value.Type === 'AWS::Lambda::LayerVersion' &&
    //   _.get(value.Properties, 'Content')
    // ) {
    //   const newVal = value;
    //   newVal.Properties.Content.S3Key = '';
    // }
  });

  // Sort resources and outputs to ensure consistent hashing
  normalizedTemplate.Resources = deepSortObjectByKey(normalizedTemplate.Resources);
  if (normalizedTemplate.Outputs) {
    normalizedTemplate.Outputs = deepSortObjectByKey(normalizedTemplate.Outputs);
  }

  return normalizedTemplate;
};
