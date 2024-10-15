import debug from 'debug';

import { mergeResources } from '../../utils';

import esm from './esm';
import iam from './iam';

const log = debug('cvo:gen:events:sqs');

export class SqsPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.generate.tapPromise(SqsPlugin.name, async (convivio) => {
      log('%j', { convivio });

      if (!convivio.yaml.functions) return;

      const functions = Object.values(convivio.yaml.functions);

      const queues = functions
        .filter((f) => f.events)
        .flatMap(({ events, ...f }) => events
          .map((e) => ({
            function: f,
            sqs: e.sqs,
          })))
        .filter((e) => e.sqs);

      log('%j', { queues });

      queues.forEach((e) => {
        mergeResources(convivio.json, esm(e, convivio));
        iam(e, convivio);
      });
    });
  }
}
