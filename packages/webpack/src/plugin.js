import _ from 'lodash';
import Promise from 'bluebird';
import debug from 'debug';

import { packExternalModules, getExternalModules } from './externals';
import { env } from './compile';
import { pack } from './pack';

const log = debug('cvo:compile:plugin');

class ConvivioWebpackPlugin {
  constructor(options) {
    this.options = options;
    // additions
  }

  apply(compiler) {
    compiler.hooks.done.tapPromise(ConvivioWebpackPlugin.name, (stats) => {
      const compileStats = _.map(stats.stats ? stats.stats : [stats], compileStats => ({
        outputPath: compileStats.compilation.compiler.outputPath,
        externalModules: getExternalModules(compileStats)
      }));

      // log('all stats: %j' , stats);
      // log('stats: %j' , compileStats);

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
