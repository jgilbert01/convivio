import _ from 'lodash';
import path from 'path';
import debug from 'debug';
import webpack from 'webpack';
import Promise from 'bluebird';

const log = debug('cvo:compile');

export const env = { // TODO remove ???
  isLocal: false,
  entries: {},
  allEntryFunctions: {},
};

export const compile = async (servicePath, service, configuration, functions, isLocal) => {
  env.isLocal = isLocal;
  env.service = service;
  env.configuration = configuration;
  env.allEntryFunctions = Object.entries(functions).map(([funcName, f]) => {
    const handlerEntry = /(.*)\..*?$/.exec(f.handler)[1];
    return { funcName, key: handlerEntry, value: `./${handlerEntry}.js` };
  });
  env.entries = env.allEntryFunctions.reduce((a, f) => {
    return { ...a, [f.key]: f.value };
  }, {});

  const webpackConfigFilePath = path.join(servicePath, 'webpack.config.js');
  const webpackConfig = require(webpackConfigFilePath)(env);

  log('%j', webpackConfig);

  const compiler = webpack(webpackConfig);

  await Promise.fromCallback(cb => compiler.run(cb));

  return {
    compiler,
    webpackConfig,
  };
};
