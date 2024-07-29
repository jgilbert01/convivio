const path = require('path');
// const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');
// const { merge } = require('webpack-merge');
// const { EnvironmentPlugin } = require('webpack');
const ZipPlugin = require('zip-webpack-plugin'); // https://www.antstack.com/blog/nodejs-lambda-bundling-tree-shaking-webpack/

// const { env } = require('./compile');
const ConvivioWebpackPlugin = require('./plugin');

const injectMocks = (entries) =>
  Object.keys(entries).reduce((e, key) => {
    e[key] = ['regenerator-runtime/runtime', './test/int/mocks.js', entries[key]];
    return e;
  }, {});

const includeMocks = () => {
  // console.log((new Error()).stack);
  return env.isLocal && process.env.REPLAY !== 'bloody';
};

const output = {
  libraryTarget: 'commonjs',
  path: path.join(process.cwd(), '.webpack'),
  filename: '[name].js'
};

const optimization = {
  minimize: false
};

const externals = [nodeExternals()];
// externals: [nodeExternals(
//   //   {
//   //   // this WILL include `jquery` and `webpack/hot/dev-server` in the bundle, as well as `lodash/*`
//   //   // allowlist: ['lambda-api', /^lodash/]
//   // }
// )],

const module = {
  rules: [{
    test: /\.js$/,
    use: [{
      loader: 'babel-loader'
    }],
    include: __dirname,
    exclude: /node_modules/
  }]
};

export const convivioDefaults = (env) => {
  // console.log('env: ', env);
  // console.log((new Error()).stack);

  if (env.isLocal) {
    const entry = includeMocks() ? injectMocks(env.entries) : env.entries;
    // const entry = includeMocks() ? env.entries : env.entries;
    // console.log('env: ', env);

    return [{
      entry,
      output,
      target: 'node',
      mode: 'development',
      // devtool: 'nosources-source-map',
      optimization,
      externals,
      module,
      plugins: [
        // ...(includeMocks() ? [new EnvironmentPlugin({ REPLAY: process.env.REPLAY || 'replay' })] : []),
      ],
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
        // new ZipPlugin({
        //   // path: path.join(process.cwd(), '.webpack'),
        //   // filename: funcName, //entryName.split('/')[1],
        //   // extension: 'zip',
        //   // pathPrefix: funcName,
        //   // include: [key],
        // }),
      ],
    }));
  }
};
