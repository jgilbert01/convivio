import _ from 'lodash';
import Promise from 'bluebird';
import debug from 'debug';
import isBuiltinModule from 'is-builtin-module';
import webpack from 'webpack';

import { packExternalModules } from './externals';
import { env } from './compile';
import { pack } from './package';

const log = debug('cvo:compile:plugin');

class ConvivioWebpackPlugin {
  constructor(options) {
    this.options = options;
    // additions
  }

  apply(compiler) {
    // log(compiler.options.entry);
    // compiler.options.entry = Object.entries(this.options.entries)
    //   .reduce((a,[k,v]) => ({...a, [k]: { import: [ v ] } }), {});

    // compiler.hooks.entryOption.tap('ConvivioWebpackPlugin', (context, entry) => {
    //   log(context, entry);
    // });

    // compiler.hooks.thisCompilation.tapPromise(ConvivioWebpackPlugin.name, async (compilation, compilationParams) => {
    //   log(compilation, compilationParams);
    // });

    // compiler.hooks.thisCompilation.tap(ConvivioWebpackPlugin.name, compilation => {
    //     compilation.hooks.processAssets.tapPromise(
    //         {
    //             name: ConvivioWebpackPlugin.name,
    //             stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER,
    //         },
    //         async (assets) => {
    // log('outputPath: %j' , compilation.compiler.outputPath);
    // // log('externalModules: %j' , getExternalModules({compilation}));
    // // log('assets: %j' , assets);
    // //   log('compilation: %j' , compilation);

    //   if (!env.isLocal) {
    //     return packExternalModules(this.options.service)({ 
    //         stats: [{
    //             outputPath: compilation.compiler.outputPath,
    //             externalModules: getExternalModules({compilation}),
    //         }], 
    //         webpackConfig: compilation.compiler.options,
    //     });
    //     // log('done');
    //   }

    //         }
    //     );
    // });

    compiler.hooks.done.tapPromise(ConvivioWebpackPlugin.name, (stats) => {
      const compileStats = _.map(stats.stats ? stats.stats : [stats], compileStats => ({
        outputPath: compileStats.compilation.compiler.outputPath,
        externalModules: getExternalModules(compileStats)
      }));

      log('all stats: %j' , stats);
      log('stats: %j' , compileStats);


      if (!env.isLocal) {
        return packExternalModules(this.options.service)({ 
            stats: compileStats, 
            webpackConfig: stats.compilation.compiler.options,
        })
        .then(() => {
            return pack({ directory: compileStats[0].outputPath, artifactFilePath: `${compileStats[0].outputPath}.zip` });
        });
      }

      return Promise.resolve();
    });
  }
};

module.exports = ConvivioWebpackPlugin;


const getExternalModules = ({ compilation }) => {
    const externals = new Set();
    for (const module of compilation.modules) {
      if (isExternalModule(module) && isUsedExports(compilation.moduleGraph, module)) {
        externals.add({
          origin: _.get(
            findExternalOrigin(compilation.moduleGraph, getIssuerCompat(compilation.moduleGraph, module)),
            'rawRequest'
          ),
          external: getExternalModuleName(module)
        });
      }
    }
    return Array.from(externals);
  };
  
  const getExternalModuleName = (module) => {
    const pathArray = /^external .*"(.*?)"$/.exec(module.identifier());
    if (!pathArray) {
      throw new Error(`Unable to extract module name from Webpack identifier: ${module.identifier()}`);
    }
  
    const path = pathArray[1];
    const pathComponents = path.split('/');
    const main = pathComponents[0];
  
    // this is a package within a namespace
    if (main.charAt(0) == '@') {
      return `${main}/${pathComponents[1]}`;
    }
  
    return main;
  };
  
  const isExternalModule = (module) => {
    return _.startsWith(module.identifier(), 'external ') && !isBuiltinModule(getExternalModuleName(module));
  };
  
  /**
   * Gets the module issuer. The ModuleGraph api does not exists in webpack@4
   * so falls back to using module.issuer.
   */
  const getIssuerCompat = (moduleGraph, module) => {
    if (moduleGraph) {
      return moduleGraph.getIssuer(module);
    }
  
    return module.issuer;
  };
  
  /**
   * Find if module exports are used. The ModuleGraph api does not exists in webpack@4
   * so falls back to using module.issuer
   * @param {Object} moduleGraph - Webpack module graph
   * @param {Object} module - Module
   */
  const getUsedExportsCompat = (moduleGraph, module) => {
    if (moduleGraph) {
      return moduleGraph.getUsedExports(module);
    }
  
    return module.usedExports;
  };
  
  /**
   * Find the original module that required the transient dependency. Returns
   * undefined if the module is a first level dependency.
   * @param {Object} moduleGraph - Webpack module graph
   * @param {Object} issuer - Module issuer
   */
  const findExternalOrigin = (moduleGraph, issuer) => {
    if (!_.isNil(issuer) && _.startsWith(issuer.rawRequest, './')) {
      return findExternalOrigin(moduleGraph, getIssuerCompat(moduleGraph, issuer));
    }
    return issuer;
  };
  
  const isUsedExports = (moduleGraph, module) => {
    // set of used exports, or true (when namespace object is used), or false (when unused), or null (when unknown)
    // @see https://github.com/webpack/webpack/blob/896efde07d775043765a300961c8b932349254bb/lib/ExportsInfo.js#L463-L466
    const usedExports = getUsedExportsCompat(moduleGraph, module);
  
    // Only returns false when unused
    return usedExports !== false;
  };
  