import {
  fromTemporaryCredentials,
  fromInstanceMetadata,
} from '@aws-sdk/credential-providers';
import { debug } from 'debug';

const log = debug('cvo:connectors:credentials');

export const cicdCredentials = () => {
  const { AWS_ROLE, AWS_REGION, CI } = process.env;
  log('%j', { AWS_ROLE, AWS_REGION, CI });

  const clientConfig = { region: AWS_REGION };

  if (AWS_ROLE) {
    return AWS_ROLE.split('|')
      .reduce((masterCredentials, RoleArn) =>
        fromTemporaryCredentials({
          params: {
            RoleArn,
            RoleSessionName: 'convivio-assume-role-cicd',
            DurationSeconds: process.env.AWS_SESSION_DURATION || 1800,
          },
          clientConfig,
          masterCredentials,
        }),
      // override chain precedence
      fromInstanceMetadata({ clientConfig }));
  }

  if (CI) {
    // override chain precedence
    return fromInstanceMetadata({ clientConfig });
  }

  return undefined;
};
