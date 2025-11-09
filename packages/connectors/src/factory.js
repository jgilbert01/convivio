import { debug } from 'debug';

import CertificateManagerConnector from './acm';
import CloudFormationConnector from './cloudformation';
import DynamoDBConnector from './dynamodb';
import SecretsManagerConnector from './secretsmgr';
import S3Connector from './s3';
import StsConnector from './sts';

const log = debug('cvo:connectors:factory');

const connectors = {};
const factories = {
  CloudFormation: (credentials, region) => new CloudFormationConnector({ debug: log, credentials, region }),
  DynamoDB: (credentials, region) => new DynamoDBConnector({ debug: log, credentials, region }),
  STS: (credentials, region) => new StsConnector({ debug: log, credentials, region }),
  S3: (credentials, region) => new S3Connector({ debug: log, credentials, region }),
  // DMS
  SecretsManager: (credentials, region) => new SecretsManagerConnector({ debug: log, credentials, region }),
  CertificateManager: (credentials, region) => new CertificateManagerConnector({ debug: log, credentials, region }),
};

export const factory = (credentials, region, service) => {
  let r = connectors[region];
  if (!r) {
    r = connectors[region] = {};
    // r = connectors[region];
  }

  let connector = r[service];
  if (!connector) {
    connector = r[service] = factories[service](credentials, region); // TODO assert
    // connector = r[service];
  }

  return connector;
};

// export const request = (credentials, region, service, method, params) => {
//   return factory(region, service)[method](params);
// };
