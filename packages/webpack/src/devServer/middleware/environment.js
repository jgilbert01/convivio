import debug from 'debug';

const log = debug('cvo:offline:env');

export const environment = (f, provider) => (req, res, next) => {
  log('%j', f.environment);

  const previousEnv = { ...process.env };
  process.env = {
    ...process.env,

    // https://github.com/serverless/serverless/blob/v1.50.0/lib/plugins/aws/invokeLocal/index.js#L108
    _HANDLER: f.handler,
    AWS_LAMBDA_FUNCTION_MEMORY_SIZE: f.memorySize ?? provider.memorySize ?? 1024,
    AWS_LAMBDA_FUNCTION_NAME: f.name,
    AWS_LAMBDA_FUNCTION_VERSION: '$LATEST',
    // https://github.com/serverless/serverless/blob/v1.50.0/lib/plugins/aws/lib/naming.js#L123
    AWS_LAMBDA_LOG_GROUP_NAME: `/aws/lambda/${f.name}`,
    AWS_LAMBDA_LOG_STREAM_NAME: '2016/12/02/[$LATEST]f77ff5e4026c45bda9a9ebcec6bc9cad',
    AWS_REGION: provider.region,
    AWS_DEFAULT_REGION: provider.region,
    LAMBDA_RUNTIME_DIR: '/var/runtime',
    LAMBDA_TASK_ROOT: '/var/task',
    LANG: 'en_US.UTF-8',
    LD_LIBRARY_PATH:
            '/usr/local/lib64/node-v4.3.x/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib:/opt/lib',
    NODE_PATH: '/var/runtime:/var/task:/var/runtime/node_modules',

    ...f.environment,

    IS_OFFLINE: 'true',
  };
  // log('%j', process.env);

  res.on('finish', () => {
    process.env = previousEnv;
    // log('%j', process.env);
  });

  next();
};
