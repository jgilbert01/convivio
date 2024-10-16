import debug from 'debug';

import { mergeResources } from '../../utils';

import esm from './esm';
import iam from './iam';

const log = debug('cvo:gen:events:stream');

export class StreamPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.generate.tapPromise(StreamPlugin.name, async (convivio) => {
      log('%j', { convivio });

      if (!convivio.yaml.functions) return;

      const functions = Object.values(convivio.yaml.functions);

      const streams = functions
        .filter((f) => f.events)
        .flatMap(({ events, ...f }) => events
          .map((e) => ({
            function: f,
            stream: e.stream,
          })))
        .filter((e) => e.stream);

      log('%j', { streams });

      streams.forEach((e) => {
        mergeResources(convivio.json, esm(e, convivio));
        iam(e, convivio);
      });
    });
  }
}
