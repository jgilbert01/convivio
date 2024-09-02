import upperFirst from 'lodash/upperFirst';
import merge from 'lodash/merge';

export const normalizeName = (name) => `${upperFirst(name)}`;

export const normalizeResourceName = (resourceName) => normalizeName(resourceName.replace(/-/g, 'Dash').replace(/_/g, 'Underscore'));

export const mergeResources = (src, tgt) => {
  merge(src.Resources ?? {}, tgt.Resources ?? {});
  merge(src.Outputs ?? {}, tgt.Outputs ?? {});
  merge(src.Conditions ?? {}, tgt.Conditions ?? {});
};

export const get = (metadata, convivio, field, defaultValue) => metadata[field] || convivio.yaml.provider[field] || defaultValue;
