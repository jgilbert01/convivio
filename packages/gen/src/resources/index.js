import merge from 'lodash/merge';
import debug from 'debug';

const log = debug('cvo:gen:resources');

const mergeResources = (src, tgt) => {
  merge(src.Resources ?? {}, tgt.Resources ?? {});
  merge(src.Outputs ?? {}, tgt.Outputs ?? {});
  merge(src.Conditions ?? {}, tgt.Conditions ?? {});
};

// NOTE place this as the last generator
// so it can override other generators

export class ResourcesPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.generate.tapPromise(ResourcesPlugin.name, async (convivio) => {
      log('%j', { convivio });
      if (!convivio.yaml.resources) return;

      if (Array.isArray(convivio.yaml.resources)) {
        convivio.yaml.resources.forEach((r) => {
          mergeResources(convivio.json, r);
        });
      } else {
        mergeResources(convivio.json, convivio.yaml.resources);
      }
    });
  }
}
