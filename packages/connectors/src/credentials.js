import {
  fromEnv,
  fromTemporaryCredentials,
  fromInstanceMetadata,
} from '@aws-sdk/credential-providers';
import { debug } from 'debug';

const log = debug('cvo:connectors:credentials');

export const cicdCredentials = (convivio) => {
  const { AWS_ROLE, AWS_ACCESS_KEY_ID, AWS_SESSION_DURATION, CI } = process.env;
  log('%j', { AWS_ROLE, AWS_SESSION_DURATION, CI });

  const clientConfig = { region: convivio.options.region };

  if (AWS_ROLE) {
    return AWS_ROLE.split('|')
      .reduce((masterCredentials, RoleArn) =>
        fromTemporaryCredentials({
          params: {
            RoleArn,
            RoleSessionName: 'convivio-assume-role-cicd',
            DurationSeconds: AWS_SESSION_DURATION || 1800,
          },
          clientConfig,
          masterCredentials,
        }),
        // override chain precedence
        AWS_ACCESS_KEY_ID ?
          fromEnv({ clientConfig }) :
          fromInstanceMetadata({ clientConfig }));
  }

  if (CI) {
    // override chain precedence
    return fromInstanceMetadata({ clientConfig });
  }

  return undefined;
};
