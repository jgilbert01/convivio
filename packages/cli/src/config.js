import {
  resolveFromObject,
  resolveFromSelf,
  resolveFromParam,
  resolveFromFile,
  resolveFromAws,
  resolveFromAwsDesc,
  resolveFromCf,
  resolveFromCvo,
  ParsePlugin,
} from '@convivio/parse';
import {
  cicdCredentials,
} from '@convivio/connectors';
import {
  AlbPlugin,
  ApiGatewayPlugin,
  CorePlugin,
  LambdaPlugin,
  ResourcesPlugin,
  StreamPlugin,
  SqsPlugin,
  SchedulePlugin,
} from '@convivio/gen';
import {
  DeployPlugin,
  CertificateManagerPlugin,
  SecretsManagerPlugin,
} from '@convivio/deploy';
import { WebpackPlugin } from '@convivio/webpack';

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
    cvo: resolveFromCvo(convivio),
    sls: resolveFromCvo(convivio),
    file: resolveFromFile(process.cwd()),
    aws: resolveFromAws(convivio),
    awsdesc: resolveFromAwsDesc(convivio),
    cf: resolveFromCf(convivio),
    ...(overrides?.resolvers || {}),
  },
  plugins: overrides?.plugins || [
    new TracePlugin(convivio.options),
    new ParsePlugin(convivio.options),

    new CorePlugin(convivio.options),
    new LambdaPlugin(convivio.options),

    new AlbPlugin(convivio.options),
    new ApiGatewayPlugin(convivio.options),

    new StreamPlugin(convivio.options),
    new SqsPlugin(convivio.options),
    new SchedulePlugin(convivio.options),

    new ResourcesPlugin(convivio.options),

    new WebpackPlugin(convivio.options),

    new DeployPlugin(convivio.options),
    new CertificateManagerPlugin(convivio.options),
    new SecretsManagerPlugin(convivio.options),
  ],
});
