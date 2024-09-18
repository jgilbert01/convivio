import { debug } from 'debug';

import CloudFormationConnector from './cloudformation';
import S3Connector from './s3';
import StsConnector from './sts';

const log = debug('cvo:connectors:factory');

// TODO credentials from assume-role

const connectors = {};
const factories = {
  'cloudFormation': () => new CloudFormationConnector({ debug: log }),
  'sts': () => new StsConnector({ debug: log }),
  's3': () => new S3Connector({ debug: log }),
};


export const factory = (region, service) => {
  let r = connectors[region];
  if (!r) {
    r = connectors[region] = {};
    // r = connectors[region];
  }

  let connector = r[service];
  if (!connector) {
    connector = r[service] = factories[service](); // TODO assert
    // connector = r[service];
  }

  return connector;
};

// export const request = (region, service, method, params) => {
//   return factory(region, service)[method](params);
// };
