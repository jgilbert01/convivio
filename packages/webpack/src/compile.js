import _ from 'lodash';
import path from 'path';
import debug from 'debug';
// import os from 'os';
import webpack from 'webpack';
import Promise from 'bluebird';
// import isBuiltinModule from 'is-builtin-module';

const log = debug('cvo:compile');

export const env = {
  isLocal: false,
  entries: {},
  allEntryFunctions: {},
};

export const compile = async (servicePath, service, functions, isLocal) => {
  env.isLocal = isLocal;
  env.service = service;
  env.allEntryFunctions = Object.entries(functions).map(([funcName, f]) => {
    const handlerEntry = /(.*)\..*?$/.exec(f.handler)[1];
    return { funcName, key: handlerEntry, value: `./${handlerEntry}.js` };
  });
  env.entries = env.allEntryFunctions.reduce((a, f) => {
    return { ...a, [f.key]: f.value };
  }, {});
  log('entries: %j', env);

  const webpackConfigFilePath = path.join(servicePath, 'webpack.config.js');
  const webpackConfig = require(webpackConfigFilePath)(env);

  // log('webpackConfig: ', webpackConfig);
  // log('entry: ', webpackConfig.entry);

  // if (isLocal) {
    return compileOne(webpackConfig);
  // } else {
  //   return Promise.map(
  //     env.allEntryFunctions,
  //     (entry) => {
  //       const config = _.cloneDeep(webpackConfig);
  //       config.entry = {
  //         [entry.key]: entry.value
  //       };
  //       log('entry: %j', config.entry);
  //       config.output.path = path.join(config.output.path, entry.funcName);
  //       return compileOne(config).then(data => data.stats);
  //     },
  //     { concurrency: os.cpus().length }
  //   ).then(stats => {
  //     console.log('stats: ', stats);
  //     return { webpackConfig, stats: _.flatten(stats) };
  //   });
  // }
};

const compileOne = async (webpackConfig) => {
  const compiler = webpack(webpackConfig);

  let stats = await Promise.fromCallback(cb => compiler.run(cb));
  stats = stats.stats ? stats.stats : [stats];
  // log('stats: %j', stats);
  // https://www.npmjs.com/package/webpack-stats-plugin

  return {
    compiler,
    webpackConfig,
    // stats: _.map(stats, compileStats => ({
    //   outputPath: compileStats.compilation.compiler.outputPath,
    //   externalModules: getExternalModules(compileStats)
    // })),
  };
};

// const getExternalModules = ({ compilation }) => {
//   const externals = new Set();
//   for (const module of compilation.modules) {
//     if (isExternalModule(module) && isUsedExports(compilation.moduleGraph, module)) {
//       externals.add({
//         origin: _.get(
//           findExternalOrigin(compilation.moduleGraph, getIssuerCompat(compilation.moduleGraph, module)),
//           'rawRequest'
//         ),
//         external: getExternalModuleName(module)
//       });
//     }
//   }
//   return Array.from(externals);
// };

// const getExternalModuleName = (module) => {
//   const pathArray = /^external .*"(.*?)"$/.exec(module.identifier());
//   if (!pathArray) {
//     throw new Error(`Unable to extract module name from Webpack identifier: ${module.identifier()}`);
//   }

//   const path = pathArray[1];
//   const pathComponents = path.split('/');
//   const main = pathComponents[0];

//   // this is a package within a namespace
//   if (main.charAt(0) == '@') {
//     return `${main}/${pathComponents[1]}`;
//   }

//   return main;
// };

// const isExternalModule = (module) => {
//   return _.startsWith(module.identifier(), 'external ') && !isBuiltinModule(getExternalModuleName(module));
// };

// /**
//  * Gets the module issuer. The ModuleGraph api does not exists in webpack@4
//  * so falls back to using module.issuer.
//  */
// const getIssuerCompat = (moduleGraph, module) => {
//   if (moduleGraph) {
//     return moduleGraph.getIssuer(module);
//   }

//   return module.issuer;
// };

// /**
//  * Find if module exports are used. The ModuleGraph api does not exists in webpack@4
//  * so falls back to using module.issuer
//  * @param {Object} moduleGraph - Webpack module graph
//  * @param {Object} module - Module
//  */
// const getUsedExportsCompat = (moduleGraph, module) => {
//   if (moduleGraph) {
//     return moduleGraph.getUsedExports(module);
//   }

//   return module.usedExports;
// };

// /**
//  * Find the original module that required the transient dependency. Returns
//  * undefined if the module is a first level dependency.
//  * @param {Object} moduleGraph - Webpack module graph
//  * @param {Object} issuer - Module issuer
//  */
// const findExternalOrigin = (moduleGraph, issuer) => {
//   if (!_.isNil(issuer) && _.startsWith(issuer.rawRequest, './')) {
//     return findExternalOrigin(moduleGraph, getIssuerCompat(moduleGraph, issuer));
//   }
//   return issuer;
// };

// const isUsedExports = (moduleGraph, module) => {
//   // set of used exports, or true (when namespace object is used), or false (when unused), or null (when unknown)
//   // @see https://github.com/webpack/webpack/blob/896efde07d775043765a300961c8b932349254bb/lib/ExportsInfo.js#L463-L466
//   const usedExports = getUsedExportsCompat(moduleGraph, module);

//   // Only returns false when unused
//   return usedExports !== false;
// };
