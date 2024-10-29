import debug from 'debug';

import { mergeResources } from '../../utils';

import listenerRules from './listener-rules';
import targetGroups from './target-groups';
import permissions from './permissions';

const log = debug('cvo:gen:events:alb');

export class AlbPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.generate.tapPromise(AlbPlugin.name, async (convivio) => {
      log('%j', { convivio });

      if (!convivio.yaml.functions) return;

      const functions = Object.values(convivio.yaml.functions);

      const albs = functions
        .filter((f) => f.events)
        .flatMap(({ events, ...f }) => events
          .map((e) => ({
            function: f,
            alb: e.alb,
          })))
        .filter((e) => e.alb);

      log('%j', { albs });

      albs.forEach((e) => {
        const ctx={};
        mergeResources(convivio.json, targetGroups(e, convivio, ctx));
        mergeResources(convivio.json, listenerRules(e, convivio, ctx));
        mergeResources(convivio.json, permissions(e, convivio, ctx));
      });
    });
  }
}
