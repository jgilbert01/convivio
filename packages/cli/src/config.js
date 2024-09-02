import {
  resolveFromObject,
  resolveFromSelf,
  resolveFromFile,
  ParsePlugin,
} from '@convivio/parse';
// TODO standard resolvers/plugins

import TracePlugin from './trace';

module.exports = (convivio) => ({
  config: ['./convivio.yml', './serverless.yml'],
  // assumeRole: undefined,
  resolvers: {
    opt: resolveFromObject(convivio.options),
    env: resolveFromObject(process.env),
    self: resolveFromSelf(convivio),
    file: resolveFromFile(process.cwd()),
    // ...standardResolvers(convivio),
  },
  plugins: [
    new TracePlugin(convivio.options),
    // new ParsePlugin(convivio.options),
    // assumeRole
    // ...standardPlugins(convivio),
    // skeleton
    // resources
    // logs
    // roles
    // lambda
    // api gateway
    // kinesis/ddb stream
    // sqs
  ],
});
