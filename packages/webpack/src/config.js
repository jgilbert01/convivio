const path = require('path');
const debug = require('debug');
const CopyPlugin = require("copy-webpack-plugin");
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
      maxSize: env.configuration.maxSize || 200000, // 200KB
    },
  }));

export const externals = (env) => (env.configuration.isLegacy
  ? [nodeExternals()]
  : env.configuration.externals || [
    /^@aws-sdk\/.+/,
    /^@smithy\/.+/,
  ]);

export const module = (env) => ({
  rules: [
    {
      test: /\.js$/,
      use: [{
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', {
              targets: {
                node: env.configuration?.node || true, // process.version.node
              },
              modules: env.isLocal ? 'umd' : env.configuration?.modules || 'cjs',
            }],
          ],
          plugins: ['@babel/plugin-transform-runtime'],
        },
      }],
      include: env.basedir, // __dirname,
      exclude: /node_modules/,
    },
    ...(env.configuration.brfs || [
      // /pdfmake\.js$/,
      /fontkit[\/\\]index.js$/,
      /unicode-trie[\/\\]index.js$/,
      /unicode-properties[\/\\]index.js$/,
      /linebreak[\/\\]src[\/\\]linebreaker.js/,
    ])
      .map((re) => re instanceof RegExp ? re : new RegExp(re))
      .map((test) => ({
        enforce: 'post',
        test,
        use: [{
          loader: 'transform-loader',
          options: { brfs: {} },
        }],
      })),
  ],
});

// TODO export more fragements like devServer, vcr, injectMocks, and module

export const convivioDefaults = (env) => {
  log('%j', { env });

  if (env.isLocal) {
    const entry = includeMocks(env) ? injectMocks(env.entries) : env.entries;
    // const entry = includeMocks(env) ? env.entries : env.entries;

    return [{
      context: env.basedir,
      entry,
      output,
      target: 'node',
      mode: 'development',
      node: env.configuration.node || false,
      // devtool: 'nosources-source-map',
      optimization: optimization(env),
      externals: externals(env),
      module: module(env),
      plugins: [],
      // TODO devServer
    }];
  } else {
    return env.allEntryFunctions.map(({ funcName, key, value }) => ({
      context: env.basedir,
      entry: { [key]: value },
      output: {
        ...output,
        path: path.join(process.cwd(), '.webpack', funcName),
      },
      target: 'node',
      mode: 'production',
      node: env.configuration.node || false,
      optimization: optimization(env),
      externals: externals(env),
      module: module(env),
      plugins: [
        new CopyPlugin({
          patterns: [
            {
              from: 'assets',
              to: 'assets',
            },
          ],
        }),
        new ConvivioWebpackPlugin({ ...env }),
      ],
    }));
  }
};
