const path = require('path');
const debug = require('debug');
const nodeExternals = require('webpack-node-externals');

const ConvivioWebpackPlugin = require('./plugin');

const log = debug('cvo:config');

export const injectMocks = (entries) =>
  Object.keys(entries).reduce((e, key) => {
    e[key] = ['regenerator-runtime/runtime', './test/int/mocks.js', entries[key]];
    return e;
  }, {});

export const includeMocks = (env) => {
  return env.isLocal && process.env.REPLAY !== 'bloody';
};

export const output = {
  libraryTarget: 'commonjs',
  path: path.join(process.cwd(), '.webpack'),
  filename: '[name].js'
};

export const optimization = {
  minimize: false
};

export const externals = [nodeExternals()];
// externals: [nodeExternals(
//   //   {
//   //   // this WILL include `jquery` and `webpack/hot/dev-server` in the bundle, as well as `lodash/*`
//   //   // allowlist: ['lambda-api', /^lodash/]
//   // }
// )],

export const module = {
  rules: [{
    test: /\.js$/,
    use: [{
      loader: 'babel-loader'
    }],
    include: __dirname,
    exclude: /node_modules/
  }]
};

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
      optimization,
      externals,
      module,
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
      optimization,
      externals,
      module,
      plugins: [
        new ConvivioWebpackPlugin({ ...env }),
      ],
    }));
  }
};
