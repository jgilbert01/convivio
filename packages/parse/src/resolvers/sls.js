import _ from 'lodash';
import debug from 'debug';

import { factory } from '@convivio/connectors';

const log = debug('cvo:parse:resolvers:sls');

export const resolveFromSls = (cvo) =>
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
