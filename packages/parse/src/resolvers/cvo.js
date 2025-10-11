import _ from 'lodash';
import debug from 'debug';

const log = debug('cvo:parse:resolvers:cvo');

export const resolveFromCvo = (cvo) =>
  async ({ param, address, defaultValue }) => {
    log('%j', { param, address, defaultValue });

    switch (address) {
      case 'instanceId': {
        return cvo.instanceId;
      }
      default: {
        return undefined;
      }
    }
  };
