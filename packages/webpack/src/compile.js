import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import debug from 'debug';
import webpack from 'webpack';
import Promise from 'bluebird';

import { convivioDefaults } from './config';

const log = debug('cvo:webpack:compile');

export const env = { // TODO remove ???
  isLocal: false,
  entries: {},
  allEntryFunctions: {},
};

export const compile = async (servicePath, service, configuration, functions, isLocal) => {
  log('%j', { servicePath, service, configuration, functions, isLocal });

  env.isLocal = isLocal;
  env.service = service;
  env.configuration = configuration;
  env.allEntryFunctions = Object.entries(functions).map(([funcName, f]) => {
    const handlerEntry = /(.*)\..*?$/.exec(f.handler)[1];
    return { funcName, key: handlerEntry, value: `./${handlerEntry}.js` };
  });
  env.entries = env.allEntryFunctions.reduce((a, f) => ({ ...a, [f.key]: f.value }), {});

  const webpackConfigFilePath = path.join(servicePath, 'webpack.config.js');
  let webpackConfig = convivioDefaults;
  if (fs.existsSync(webpackConfigFilePath)) {
    webpackConfig = require(webpackConfigFilePath);
  }
  webpackConfig = webpackConfig(env);
  log('%j', { webpackConfig });

  const compiler = webpack(webpackConfig);
  log('%j', { compiler });

  await Promise.fromCallback((cb) => compiler.run(cb));

  return {
    compiler,
    webpackConfig,
  };
};
