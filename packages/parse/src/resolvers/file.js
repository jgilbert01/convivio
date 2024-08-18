import debug from 'debug';

// NOTE: only supporting yaml at this point
import { load } from '../yaml';
import { resolveOnePass } from '../resolve';

const log = debug('cvo:parse:resolvers:file');

export const resolveFromFile = (basedir) =>
  async ({ param, address, defaultValue }, resolvers) => {
    const yaml = load(basedir, param);
    log('%j', {
      basedir, address, defaultValue, yaml,
    });
    return resolveOnePass(yaml[address], resolvers);
  };
