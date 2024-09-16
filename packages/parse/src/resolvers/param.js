import _ from 'lodash';
import debug from 'debug';

const log = debug('cvo:parse:resolvers:self');

export const resolveFromParam = (cvo) =>
  async ({ address, defaultValue }) => {
    log('%j', { address, defaultValue, yaml: cvo.yaml });
    const { params } = cvo.yaml; // TODO stages
    const param = params[cvo.options.stage];
    const defaults = params.default || {};
    return _.get(param, address, _.get(defaults, address, defaultValue));
  };
