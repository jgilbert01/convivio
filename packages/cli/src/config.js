import {
  resolveFromObject,
  resolveFromSelf,
  resolveFromParam,
  resolveFromFile,
  resolveFromAws,
  resolveFromCf,
  // standardResolvers
  ParsePlugin,
} from '@convivio/parse';
import {
  CorePlugin,
  LambdaPlugin,
  ResourcesPlugin,
  // standardResolvers
} from '@convivio/gen';
import { DeployPlugin } from '@convivio/deploy';
import { WebpackPlugin } from '@convivio/webpack';

// TODO standard resolvers/plugins

import TracePlugin from './trace';

export default (convivio, overrides) => ({
  basedir: process.cwd(),
  config: [
    ...(overrides?.config || []),
    './convivio.yml',
    './serverless.yml',
  ],
  servicePath: overrides?.servicePath || '.',
  // assumeRole: undefined,
  resolvers: {
    opt: resolveFromObject(convivio.options),
    env: resolveFromObject(process.env),
    self: resolveFromSelf(convivio),
    param: resolveFromParam(convivio),
    // sls: resolveFromSls(convivio),
    file: resolveFromFile(process.cwd()),
    aws: resolveFromAws(convivio),
    // awsdesc: resolveFromAwsDesc(convivio),
    cf: resolveFromCf(convivio),
    // s3: resolveFromCf(convivio),
    // ssm: resolveFromCf(convivio),

    // ...standardResolvers(convivio),
    ...(overrides?.resolvers || {}),
  },
  plugins: overrides?.plugins || [
    // assumeRole

    new TracePlugin(convivio.options),
    new ParsePlugin(convivio.options),

    // ...standardGenPlugins(convivio),
    new CorePlugin(convivio.options),
    new LambdaPlugin(convivio.options),
    // TODO events
    //  api gateway
    //  kinesis/ddb stream
    //  sqs

    // TODO insert generators ???
    new ResourcesPlugin(convivio.options),

    // TODO swap packaging ???
    new WebpackPlugin(convivio.options),

    new DeployPlugin(convivio.options),
  ],
});
