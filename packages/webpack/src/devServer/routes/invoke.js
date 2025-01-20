import path from 'path';
import debug from 'debug';
import { environment, vcrNock } from '../middleware';
import { context } from './context';

const log = debug('cvo:offline:routes:consume');

export default (servicePath, devServer, f, e, provider, vcr) => {
  // https://docs.aws.amazon.com/lambda/latest/api/API_Invoke.html

  // log(handle, f.name);

  // TODO ???
  // const clientContextHeader = parsedHeaders.get("x-amz-client-context")
  // const invocationType = parsedHeaders.get("x-amz-invocation-type")

  devServer.app.post(
    `/2015-03-31/functions/${f.name}/invocations`,
    environment(f, provider),
    vcrNock(f, vcr),
    async (req, res) => {
      try {
        const [index, handle] = f.handler.split('.');
        const lambda = require(path.join(servicePath, '.webpack', index));

        // log(handle, f.name, JSON.parse(req.body));

        const ctx = context(f, provider);
        const data = await lambda[handle](JSON.parse(req.body), ctx);
        res.status(200).json(data); // TODO assert size
      } catch (err) {
        console.error(err);
        res
          .status(200)
          .set('X-Amzn-ErrorType', 'Unhandled')
          .json({
            errorMessage: err.message,
            errorType: 'Error',
            trace: err.stack.split('\n'),
          });
      }
    },
  );
};
