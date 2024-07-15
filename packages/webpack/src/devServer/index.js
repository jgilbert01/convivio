import _ from 'lodash';
import path from 'path';
import debug from 'debug';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import ping from './routes/ping';
import rest from './routes/rest';
import consume from './routes/consume';
import { trace } from './middleware';

debug.formatters.j = (v) => {
  try {
    return JSON.stringify(v, null, 2);
  } catch (error) {
    return `[UnexpectedJSONParseError]: ${error.message}`;
  }
};

const log = debug('cvo:offline:function');

export const setupMiddlewares = (servicePath, functions, provider, vcr) => (middlewares, devServer) => {
  devServer.app.use(trace);
  ping(devServer);

  Object.values(functions).forEach((f) => {
    log('%j', f);

    f.events.forEach((e) => {
      const {
        http, stream, sqs, alb,
      } = e;

      if (http) {
        return rest(servicePath, devServer, f, e, provider, vcr);
      }
      // TODO alb
      if (stream || sqs) {
        return consume(servicePath, devServer, f, e, provider, vcr);
      }

      throw new Error('Unknown event type: ', e);
    });
  });

  return middlewares;
};

export const start = async (servicePath, functions, provider) => {
  const webpackConfigFilePath = path.join(servicePath, 'webpack.config.js');
  const webpackConfig = require(webpackConfigFilePath);
  const compiler = webpack(webpackConfig);

  const { vcr = {}, ...devServer } = webpackConfig.devServer || {};
  const devServerOptions = {
    port: 3001,
    setupMiddlewares: setupMiddlewares(servicePath, functions, provider, vcr),
    ...devServer,
  };

  const server = new WebpackDevServer(devServerOptions, compiler);
  await server.start();
};
