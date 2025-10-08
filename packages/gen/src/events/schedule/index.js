import debug from 'debug';

import { mergeResources } from '../../utils';

import rule from './rule';
import permissions from './permissions';

const log = debug('cvo:gen:events:schedule');

export class SchedulePlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.generate.tapPromise(SchedulePlugin.name, async (convivio) => {
      log('%j', { convivio });

      if (!convivio.yaml.functions) return;

      const functions = Object.values(convivio.yaml.functions);

      const schedules = functions
        .filter((f) => f.events)
        .flatMap(({ events, ...f }) => events
          .map((e) => ({
            function: f,
            schedule: typeof e.schedule === 'object' ? e.schedule : { rate: e.schedule },
          })))
        .filter((e) => e.schedule)
        .flatMap((e) => (Array.isArray(e.schedule.rate)
          ? e.schedule.rate
            .map((rate) => ({
              ...e,
              schedule: {
                ...e.schedule,
                rate,
              },
            }))
          : [e]));

      log('%j', { schedules });

      schedules.forEach((e, i) => {
        mergeResources(convivio.json, rule(e, i + 1, convivio));
        mergeResources(convivio.json, permissions(e, i + 1, convivio));
      });
    });
  }
}
