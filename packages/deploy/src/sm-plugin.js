import debug from 'debug';

import { factory } from '@convivio/connectors';

const log = debug('cvo:sm:plugin');

export class SecretsManagerPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.predeploy.tapPromise(SecretsManagerPlugin.name, putSecrets(true));
    cvo.hooks.postdeploy.tapPromise(SecretsManagerPlugin.name, putSecrets(false));
  }
}

let updated = false;

const putSecrets = (pre) => async (convivio) => {
  log('%j', { convivio });

  if (!cvo.yaml.custom?.secrets) return;

  if (cvo.yaml.custom.secrets.afterDeployOnly && pre) return;

  if (updated) return;

  try {
    const config = {
      secretId: `${convivio.yaml.service}/${options.stage}`,
      ...convivio.yaml.custom.secrets,
    };

    if (
      config.variableNames === undefined ||
      config.variableNames.length === 0
    ) {
      console.log('secrets-mgr-plugin: variableNames not defined. Skipping secrets upload.');
      return;
    }

    const secrets = config.variableNames
      .filter((vn) => {
        if (process.env[vn] === undefined) {
          console.log('secrets-mgr-plugin: missing variable: ', vn);
          return false;
        } else {
          return true;
        }
      })
      .reduce((a, vn) => ({
        [vn]: process.env[vn],
        ...a,
      }), {});

    const connector = factory(convivio.config.credentials, convivio.options.region, 'SecretsManager');

    return connector.listSecrets({
      Filters: [{
        Key: 'name',
        Values: [config.secretId]
      }]
    })
      .then((data) => {
        if (config.debug) console.log(data);

        const found = data.SecretList.find((e) => e.Name === config.secretId);

        if (found) {
          return connector.putSecretValue({
            SecretId: config.secretId,
            SecretString: Buffer.from(JSON.stringify(secrets)).toString('base64'),
          })
            .then((data) => {
              updated = true;
              console.log('putSecretValue: %j', data);
            });
        }
      });
  } catch (err) {
    console.log(err);
  }
};
