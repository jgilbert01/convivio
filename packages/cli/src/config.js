import {
  resolveFromObject,
  resolveFromSelf,
  resolveFromParam,
  resolveFromFile,
  resolveFromAws,
  resolveFromAwsDesc,
  resolveFromCf,
  // TODO standardResolvers ???
  ParsePlugin,
} from '@convivio/parse';
import {
  cicdCredentials,
} from '@convivio/connectors';
import {
  CorePlugin,
  LambdaPlugin,
  ResourcesPlugin,
  StreamPlugin,
  SqsPlugin,
  SchedulePlugin,
  // TODO standardGenerators ???
} from '@convivio/gen';
import {
  DeployPlugin,
  CertificateManagerPlugin,
  SecretsManagerPlugin,
} from '@convivio/deploy';
import { WebpackPlugin } from '@convivio/webpack';

// TODO standard resolvers/plugins presets

import TracePlugin from './trace';

export default (convivio, overrides) => ({
  basedir: process.cwd(),
  servicePath: overrides?.servicePath || '.',
  config: [
    ...(overrides?.config || []),
    './convivio.yml',
    './serverless.yml',
  ],
  credentials: (overrides?.credentials || cicdCredentials)(convivio, overrides),
  resolvers: {
    opt: resolveFromObject(convivio.options),
    env: resolveFromObject(process.env),
    self: resolveFromSelf(convivio),
    param: resolveFromParam(convivio),
    // sls: resolveFromSls(convivio),
    file: resolveFromFile(process.cwd()),
    aws: resolveFromAws(convivio),
    awsdesc: resolveFromAwsDesc(convivio),
    cf: resolveFromCf(convivio),
    // s3: resolveFromCf(convivio),
    // ssm: resolveFromCf(convivio),

    // ...standardResolvers(convivio),
    ...(overrides?.resolvers || {}),
  },
  plugins: overrides?.plugins || [
    new TracePlugin(convivio.options),
    new ParsePlugin(convivio.options),

    // ...standardGenPlugins(convivio),
    new CorePlugin(convivio.options),
    new LambdaPlugin(convivio.options),

    // TODO events
    //  api gateway
    //  alb
    //  sqs
    //  sns ???
    //  cloudwatch / schedule*2
    //  s3 ???
    //  kafka

    new StreamPlugin(convivio.options),
    new SqsPlugin(convivio.options),
    new SchedulePlugin(convivio.options),

    new ResourcesPlugin(convivio.options),

    // TODO swap packaging ???
    new WebpackPlugin(convivio.options),

    new DeployPlugin(convivio.options),
    new CertificateManagerPlugin(convivio.options),
    new SecretsManagerPlugin(convivio.options),
  ],
});
