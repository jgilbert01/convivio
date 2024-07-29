import _ from 'lodash';
import debug from 'debug';
import WebpackDevServer from 'webpack-dev-server';

import ping from './routes/ping';
import rest from './routes/rest';
import consume from './routes/consume';
import { trace } from './middleware';
import { compile } from '../compile';

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

// TODO assume lambda role

export const start = async (servicePath, service, functions, provider) => {
  // console.log('functions: ', Object.values(functions));
  const { compiler, webpackConfig } = await compile(servicePath, service, functions, true);

  const { vcr = {}, ...devServer } = webpackConfig.devServer || {};
  const devServerOptions = {
    port: 3001,
    setupMiddlewares: setupMiddlewares(servicePath, functions, provider, vcr),
    ...devServer,
  };

  const server = new WebpackDevServer(devServerOptions, compiler);
  await server.start();
};
