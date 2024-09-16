import _ from 'lodash';
import debug from 'debug';

import { factory } from '@convivio/connectors';

const log = debug('cvo:parse:resolvers:aws');

export const resolveFromAws = (cvo) =>
  async ({ param, address, defaultValue }) => {
    log('%j', { param, address, defaultValue });

    switch (address) {
      case 'accountId': {
        const connector = factory(cvo.options.region, 'sts');
        const { Account } = await connector.getCallerIdentity();
        return Account;
      }
      case 'partition': {
        const connector = factory(cvo.options.region, 'sts');
        const { Arn } = await connector.getCallerIdentity();
        return Arn.split(':')[1];
      }
      case 'region': {
        if (cvo.options.region) {
          return cvo.options.region;
        } else {
          return _.get(cvo.yaml, 'provider.region', defaultValue);
        }
      }
      default: {
        return undefined;
      }
    }
  };
