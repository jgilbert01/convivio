import crypto from 'crypto';
import fs from 'fs';
import _ from 'lodash';

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
      `Cannot read file artifact "${filepath}": ${error.message}`,
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
        .map(([key, value]) => [key, deepSortObjectByKey(value)]),
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

export const getS3EndpointForRegion = (convivio) => {
  const strRegion = convivio.options.region.toLowerCase();
  // look for govcloud - currently s3-us-gov-west-1.amazonaws.com
  if (strRegion.match(/us-gov/)) return `s3-${strRegion}.amazonaws.com`;
  // look for china - currently s3.cn-north-1.amazonaws.com.cn
  if (strRegion.match(/cn-/)) return `s3.${strRegion}.amazonaws.com.cn`;
  // look for AWS ISO (US)
  if (strRegion.match(/iso-/)) return `s3.${strRegion}.c2s.ic.gov`;
  // look for AWS ISOB (US)
  if (strRegion.match(/isob-/)) return `s3.${strRegion}.sc2s.sgov.gov`;
  // default s3 endpoint for other regions
  return 's3.amazonaws.com';
};

export const getArtifactDirectoryName = (convivio) => {
  if (!convivio.yaml.package) {
    convivio.yaml.package = {};
  }
  
  if (!convivio.yaml.package.artifactDirectoryName) {
    const date = new Date();
    const serviceStage = `${convivio.yaml.service}/${convivio.options.stage}`;
    const dateString = `${date.getTime().toString()}-${date.toISOString()}`;
    const prefix = convivio.yaml.provider?.deploymentPrefix || 'convivio';
    convivio.yaml.package.artifactDirectoryName = `${prefix}/${serviceStage}/${dateString}`;
  }

  return convivio.yaml.package.artifactDirectoryName;
};
