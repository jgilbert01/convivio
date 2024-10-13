import debug from 'debug';
import upperFirst from 'lodash/upperFirst';
import merge from 'lodash/merge';

const log = debug('cvo:gen:utils');

export const normalizeName = (name) => `${upperFirst(name)}`;

export const normalizeNameToAlphaNumericOnly = (name) => normalizeName(name.replace(/[^0-9A-Za-z]/g, ''));

export const normalizeResourceName = (resourceName) => normalizeName(resourceName.replace(/-/g, 'Dash').replace(/_/g, 'Underscore'));

export const mergeResources = (tgt, src) => {
  // log('%j', { src, tgt });

  // remove undefined
  src = JSON.parse(JSON.stringify(src));
  merge(tgt.Resources ?? {}, src.Resources ?? {});
  merge(tgt.Outputs ?? {}, src.Outputs ?? {});
  merge(tgt.Conditions ?? {}, src.Conditions ?? {});
};

export const get = (metadata, convivio, field, defaultValue) => metadata[field] || convivio.yaml.provider[field] || defaultValue;

export const getArtifactDirectoryName = (convivio) => {
  if (!convivio.yaml.package.artifactDirectoryName) {
    const date = new Date();
    const serviceStage = `${convivio.yaml.service}/${convivio.options.stage}`;
    const dateString = `${date.getTime().toString()}-${date.toISOString()}`;
    const prefix = convivio.yaml.provider?.deploymentPrefix || 'convivio';
    convivio.yaml.package.artifactDirectoryName = `${prefix}/${serviceStage}/${dateString}`;
  }

  return convivio.yaml.package.artifactDirectoryName;
};
