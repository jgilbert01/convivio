import _ from 'lodash';
import debug from 'debug';
import express from 'express';
import WebpackDevServer from 'webpack-dev-server';

import ping from './routes/ping';
import rest from './routes/rest';
import consume from './routes/consume';
import { trace } from './middleware';
import { compile } from '../compile';

const log = debug('cvo:offline:function');

export const setupMiddlewares = (servicePath, functions, provider, vcr) => (middlewares, devServer) => {
  devServer.app.use(express.json({ limit: 1024 * 1024 * 6 })); // for parsing application/json
  devServer.app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
  devServer.app.use(express.raw()); // for parsing application/octet-stream

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

export const start = async (servicePath, service, configuration, functions, provider) => {
  // log('functions: ', Object.values(functions));
  const { compiler, webpackConfig } = await compile(servicePath, service, configuration, functions, true);

  const { vcr = {}, ...devServer } = webpackConfig.devServer || {};
  const devServerOptions = {
    port: configuration.port || 3001,
    setupMiddlewares: setupMiddlewares(servicePath, functions, provider, vcr),
    ...devServer,
    setupExitSignals: false,
  };

  const server = new WebpackDevServer(devServerOptions, compiler);
  await server.start();
};
