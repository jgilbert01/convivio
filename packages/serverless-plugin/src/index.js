import _ from 'lodash';
import Promise from 'bluebird';

import { start /*, compile, package */ } from '@convivio/webpack';

const getFunctions = (serverless) => {
  const env = serverless.service.provider.environment || {};
  return serverless.service.getAllFunctions()
    .reduce((a, key) => ({
      ...a,
      [key]: {
        ...serverless.service.getFunction(key),
        environment: {
          ...env,
          ...(serverless.service.getFunction(key).environment || {}),
        }
      }
    }), {});
};

class Plugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    _.assign(this, { start });

    this.commands = {
      offline: {
        commands: {
          start: {
            // lifecycleEvents: ["init", "ready", "end"],
            // options: commandOptions,
          },
        },
        lifecycleEvents: ['start'],
        // options: commandOptions,
        // usage: "Simulates API Gateway to call your lambda functions offline.",
      },
    };

    this.hooks = {
      // 'before:package:createDeploymentArtifacts': () => Promise.bind(this).then(this.compile)
      'offline:start': () => Promise.bind(this).then(() => {
        // console.log(JSON.stringify(this.serverless, null, 2));
        // console.log(this.serverless, null, 2);
        const { servicePath } = this.serverless.config;
        const functions = getFunctions(this.serverless);
        // console.log('functions: ', JSON.stringify(functions, null, 2));

        this.start(servicePath, functions, this.serverless.service.provider);
      }),
    };
  }

  // async compile() {
  //   const webpackConfigFilePath = path.join(this.serverless.config.servicePath, 'webpack.config.js');
  //   return Promise.fromCallback(cb => webpack(require(webpackConfigFilePath)).run(cb));
  // };
}

// export default Plugin;
module.exports = Plugin;
