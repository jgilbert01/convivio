import debug from 'debug';

import { writeFileSync } from '@convivio/connectors';

import { mergeResources } from '../utils';

const log = debug('cvo:gen:resources');

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

      writeFileSync('./.convivio/cloudformation-template.json', convivio.json);
    });
  }
}
