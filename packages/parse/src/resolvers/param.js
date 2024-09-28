import _ from 'lodash';
import debug from 'debug';

const log = debug('cvo:parse:resolvers:self');

export const resolveFromParam = (cvo) =>
  async ({ address, defaultValue }) => {
    log('%j', { address, defaultValue, yaml: cvo.yaml });
    const { params } = cvo.yaml; // TODO stages

    if (typeof params === 'string') {
      // params is not resolved yet
      return undefined;
    }

    const param = params[cvo.options.stage];
    const defaults = params.default || {};
    if (!param && !params.default) {
      throw new Error(`Unknown param stage: ${cvo.options.stage} for ${address}`);
    }
    return _.get(param, address, _.get(defaults, address, defaultValue));
  };
