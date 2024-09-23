const path = require('path');
const debug = require('debug');
const nodeExternals = require('webpack-node-externals');

const ConvivioWebpackPlugin = require('./wplugin');

const log = debug('cvo:webpack:config');

export const injectMocks = (entries) =>
  Object.keys(entries).reduce((e, key) => {
    e[key] = ['regenerator-runtime/runtime', './test/int/mocks.js', entries[key]];
    return e;
  }, {});

export const includeMocks = (env) => env.isLocal && process.env.REPLAY !== 'bloody';

export const output = {
  libraryTarget: 'commonjs',
  path: path.join(process.cwd(), '.webpack'),
  filename: '[name].js',
};

// https://webpack.js.org/guides/code-splitting/
export const optimization = (env) => (env.configuration.isLegacy
  ? ({
    minimize: false,
  }) : ({
    minimize: false,
    splitChunks: {
      chunks: 'all',
      maxSize: 200000, // 200KB
    },
  }));

export const externals = (env) => (env.configuration.isLegacy
  ? [nodeExternals()]
  : [
    /^@aws-sdk\/.+/,
    /^@smithy\/.+/,
  ]);

export const module = (env) => ({
  rules: [{
    test: /\.js$/,
    use: [{
      loader: 'babel-loader',
      options: {
        presets: [
          ['@babel/preset-env', {
            targets: {
              node: env.configuration?.node || '20',
            },
          }],
        ],
        plugins: ['@babel/plugin-transform-runtime'],
      },
    }],
    include: __dirname,
    exclude: /node_modules/,
  }],
});

// TODO export more fragements like devServer, vcr, injectMocks, and module

export const convivioDefaults = (env) => {
  log('%j', env);

  if (env.isLocal) {
    const entry = includeMocks(env) ? injectMocks(env.entries) : env.entries;
    // const entry = includeMocks(env) ? env.entries : env.entries;

    return [{
      entry,
      output,
      target: 'node',
      mode: 'development',
      // devtool: 'nosources-source-map',
      optimization: optimization(env),
      externals: externals(env),
      module: module(env),
      plugins: [],
      // TODO devServer
    }];
  } else {
    return env.allEntryFunctions.map(({ funcName, key, value }) => ({
      entry: { [key]: value },
      output: {
        ...output,
        path: path.join(process.cwd(), '.webpack', funcName),
      },
      target: 'node',
      mode: 'production',
      optimization: optimization(env),
      externals: externals(env),
      module: module(env),
      plugins: [
        new ConvivioWebpackPlugin({ ...env }),
      ],
    }));
  }
};
