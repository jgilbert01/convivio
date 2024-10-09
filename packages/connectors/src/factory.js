import { debug } from 'debug';

import CloudFormationConnector from './cloudformation';
import DynamoDBConnector from './dynamodb';
import S3Connector from './s3';
import StsConnector from './sts';

const log = debug('cvo:connectors:factory');

// TODO credentials from assume-role

const connectors = {};
const factories = {
  CloudFormation: (credentials) => new CloudFormationConnector({ debug: log, credentials }),
  DynamoDB: (credentials) => new DynamoDBConnector({ debug: log, credentials }),
  STS: (credentials) => new StsConnector({ debug: log, credentials }),
  S3: (credentials) => new S3Connector({ debug: log, credentials }),
};

export const factory = (credentials, region, service) => {
  let r = connectors[region];
  if (!r) {
    r = connectors[region] = {};
    // r = connectors[region];
  }

  let connector = r[service];
  if (!connector) {
    connector = r[service] = factories[service](credentials); // TODO assert
    // connector = r[service];
  }

  return connector;
};

// export const request = (credentials, region, service, method, params) => {
//   return factory(region, service)[method](params);
// };
