import debug from 'debug';

import { parse } from './parse';

const log = debug('cvo:parse:resolve');

const resolve = async (key, value, resolvers) => {
  if (typeof value === 'string') {
    const parsed = await parse(value, resolvers);
    log('%j', { key, value, parsed });
    return parsed;
  } else

  if (Array.isArray(value)) {
    log('%j', { key, array: value });
    return Promise.all(value.map((y) => resolve(undefined, y, resolvers)));
  } else

  if (value instanceof Object) {
    log('%j', { key, object: value });
    return resolveOnePass(value, resolvers);
  }

  return value;
};

export const resolveOnePass = async (yaml, resolvers) =>
  // log('%j', { resolveOnePass: yaml });
  Object.entries(yaml || {})
    .reduce(async (a, [key, value]) => {
      a = await a;
      a[key] = await resolve(key, value, resolvers);
      // a[key] = await resolve(key, value, resolvers);
      return a;
    }, yaml);
export const resolveAll = async (yaml, resolvers) => {
  log('%j', { pass0: yaml });

  // pass 1
  await resolveOnePass(yaml, resolvers);
  log('%j', { pass1: yaml });

  // pass 2
  await resolveOnePass(yaml, resolvers);
  log('%j', { pass2: yaml });

  // pass 3
  await resolveOnePass(yaml, resolvers);
  log('%j', { pass3: yaml });

  return yaml;
};
