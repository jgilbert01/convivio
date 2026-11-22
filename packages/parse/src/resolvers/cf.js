import _ from 'lodash';
import debug from 'debug';

import { factory } from '@convivio/connectors';

const log = debug('cvo:parse:resolvers:cf');

// cf(region):stackName.outputLogicalId
export const resolveFromCf = (cvo) => async ({ param, address, defaultValue }) => {
  log('%j', { param, address, defaultValue });

  const separatorIndex = address.indexOf('.');
  const stackName = address.slice(0, separatorIndex);
  const outputLogicalId = address.slice(separatorIndex + 1);
  log('%j', { stackName, outputLogicalId });

  const connector = factory(cvo.config.credentials, param || cvo.options.region, 'CloudFormation');
  const result = await connector
    .describeStacks({ StackName: stackName })
    .catch(() => false); // TODO check error type

  const dv = _.trim(defaultValue, "'"); // TODO double quotes ?

  if (!result) return dv;

  const outputs = result.Stacks[0].Outputs;
  const output = outputs.find((x) => x.OutputKey === outputLogicalId);
  return _.get(output, 'OutputValue', dv);
};
