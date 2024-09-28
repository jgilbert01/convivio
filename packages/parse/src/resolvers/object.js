import _ from 'lodash';
import debug from 'debug';

const log = debug('cvo:parse:resolvers:obj');

export const resolveFromObject = (values) =>
  async ({ address, defaultValue }) => {
    log('%j', { address, defaultValue, values });
    return _.get(values, address, defaultValue);
  };
