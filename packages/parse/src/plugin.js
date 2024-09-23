import fs from 'fs';
import path from 'path';
import debug from 'debug';

import { writeFileSync } from '@convivio/connectors';

import { load } from './yaml';
import { resolveAll } from './resolve';

const log = debug('cvo:parse:plugin');

export class ParsePlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.parse.tapPromise(ParsePlugin.name, async (convivio) => {
      log('%j', { convivio });
      convivio.yaml = await load(convivio.config.basedir, filename(convivio.config.basedir, convivio.config.config));
      convivio.yaml = await resolveAll(convivio.yaml, convivio.config.resolvers);
      fattenFunctions(convivio);
      writeFileSync('./.convivio/state.json', convivio.yaml);
    });
  }
}

const filename = (basedir, filenames) => filenames.reduce((a, fn) => {
  log('%j', {
    basedir, filenames, a, fn,
  });
  if (!a && fs.existsSync(path.resolve(basedir, fn))) {
    return fn;
  } else {
    return a;
  }
}, undefined);

const fattenFunctions = (convivio) => {
  const env = convivio.yaml.provider.environment || {};
  log({ functions: convivio.yaml.functions, env });
  return Object.entries(convivio.yaml.functions || {})
    .map(([key, funct]) => {
      log({ key, funct });
      funct.key = key;
      const handlerEntry = /(.*)\..*?$/.exec(funct.handler)[1];
      funct.handlerEntry = { key: handlerEntry, value: `./${handlerEntry}.js` };
      funct.package = {
        artifact: `./.webpack/${key}.zip`,
      };
      return {
        key,
        funct,
      };
    })
    .reduce((a, { key, funct }) => ({
      ...a,
      [key]: {
        ...funct,
        environment: {
          ...env,
          ...(funct.environment || {}),
        },
      },
    }), {});
};
