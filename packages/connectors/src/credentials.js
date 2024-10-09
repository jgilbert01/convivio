import {
  fromTemporaryCredentials,
  fromInstanceMetadata,
} from '@aws-sdk/credential-providers';
import { debug } from 'debug';

const log = debug('cvo:connectors:credentials');

export const cicdCredentials = () => {
  const { AWS_ROLE, CI } = process.env;
  log('%j', { AWS_ROLE, CI });

  if (AWS_ROLE) {
    return AWS_ROLE.split('|')
      .reduce((masterCredentials, RoleArn) =>
        fromTemporaryCredentials({
          params: {
            RoleArn,
            RoleSessionName: 'convivio-assume-role-cicd',
            DurationSeconds: process.env.AWS_SESSION_DURATION || 1800,
          },
          masterCredentials,
        }),
        // override chain precedence
        fromInstanceMetadata());
  }

  if (CI) {
    // override chain precedence
    return fromInstanceMetadata();
  }

  return undefined;
};
