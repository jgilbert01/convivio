const slsw = require('serverless-webpack');
// const slsw = require('./.serverless_plugins/satellite');
const nodeExternals = require('webpack-node-externals');
const path = require('path');
const { EnvironmentPlugin } = require('webpack');

// const injectMocks = (entries) =>
//   Object.keys(entries).reduce((e, key) => {
//     e[key] = ['regenerator-runtime/runtime', './test/int/mocks.js', entries[key]];
//     return e;
//   }, {});

const includeMocks = () => slsw.lib.webpack.isLocal && process.env.REPLAY !== 'bloody';

// const entry = includeMocks() ? injectMocks(slsw.lib.entries) : slsw.lib.entries;

// console.log('slsw.lib.entries: ', slsw.lib.entries);

module.exports = {
  entry: slsw.lib.entries,
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
    // sourceMapFilename: '[file].map'
  },
  optimization: {
    minimize: false
  },
  target: 'node',
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  // performance: {
  //   // Turn off size warnings for entry points
  //   hints: false
  // },
  // devtool: 'nosources-source-map',
  externals: [nodeExternals()],
  plugins: includeMocks() ? [new EnvironmentPlugin({ REPLAY: process.env.REPLAY || 'replay' })] : undefined,
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader'
          }
        ],
        include: __dirname,
        exclude: /node_modules/
      }
    ]
  }
};
