import { debug } from 'debug';

import CloudFormationConnector from './cloudformation';
import S3Connector from './s3';
import StsConnector from './sts';

const connectors = {};
const factories = {
  'cloudFormation': () => new CloudFormationConnector({ debug }),
  'sts': () => new StsConnector({ debug }),
  's3': () => new S3Connector({ debug }),
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

export const request = (region, service, method, params) => {
  return factory(region, service)[method](params);
};
