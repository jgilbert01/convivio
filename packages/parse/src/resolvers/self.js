import _ from 'lodash';
import debug from 'debug';

const log = debug('cvo:parse:resolvers:self');

export const resolveFromSelf = (cvo) =>
  async ({ address, defaultValue }) => {
    log('%j', { address, defaultValue, yaml: cvo.yaml });
    return _.get(cvo.yaml, address, defaultValue);
  };
