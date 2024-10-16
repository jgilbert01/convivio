import debug from 'debug';
import { cloneDeep } from 'lodash';

import { ENVELOPE } from './core-cloudformation-template';

const log = debug('cvo:gen:core');

export class CorePlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.generate.tapPromise(CorePlugin.name, async (convivio) => {
      log('%j', { convivio });
      convivio.json = cloneDeep(ENVELOPE); // compiledCloudFormationTemplate
    });
  }
}
