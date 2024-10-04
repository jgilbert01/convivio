import _ from 'lodash';
import Promise from 'bluebird';

import { start, compile } from '@convivio/webpack';

const getFunctions = (serverless) => {
  const env = serverless.service.provider.environment || {};
  return serverless.service.getAllFunctions()
    .map((key) => {
      const funct = serverless.service.getFunction(key);
      funct.key = key;
      const handlerEntry = /(.*)\..*?$/.exec(funct.handler)[1];
      funct.handlerEntry = { key: handlerEntry, value: `./${handlerEntry}.js` };
      funct.package = {
        artifact: `./.webpack/${key}.zip`,
      };
      return {
        key,
        funct,
      };
    })
    .reduce((a, { key, funct }) => ({
      ...a,
      [key]: {
        ...funct,
        environment: {
          ...env,
          ...(funct.environment || {}),
        }
      }
    }), {});
};

class Plugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    _.assign(this, { start, compile });

    this.commands = {
      offline: {
        commands: {
          start: {
          },
        },
        lifecycleEvents: ['start'],
      },
    };

    this.hooks = {
      'before:package:createDeploymentArtifacts': () => Promise.bind(this).then(() => {
        const { servicePath } = this.serverless.config;
        const service = this.serverless.service.service;
        const configuration = this.serverless.service.custom.webpack || {};
        const functions = getFunctions(this.serverless);
        return this.compile(servicePath, service, configuration, functions);
      }),

      'offline:start': () => Promise.bind(this).then(() => {
        const { servicePath } = this.serverless.config;
        const service = this.serverless.service.service;
        const configuration = this.serverless.service.custom.webpack || {};
        const functions = getFunctions(this.serverless);
        this.start(servicePath, service, configuration, functions, this.serverless.service.provider);
      }),
    };
  }
}

// export default Plugin;
module.exports = Plugin;
