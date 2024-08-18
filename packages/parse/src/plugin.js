import debug from 'debug';

import { load } from './yaml';

const log = debug('cvo:parse:plugin');

export class ParsePlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.parse.tapPromise(ParsePlugin.name, async (convivio) => {
      log('%j', { convivio });
      convivio.yaml = await load(process.cwd(), convivio.config.config);
    });
  }
}
