import nock from 'nock';
import fs from 'fs';
import path from 'path';
import debug from 'debug';
import { cloneDeepWith } from 'lodash';

const log = debug('cvo:offline:vcr:nock');

const REGEX = 'regex:';

const prepareBodyRegex = (def) => {
  if (!def.body) return;

  if (typeof def.body === 'string') {
    if (def.body.startsWith(REGEX)) {
      def.body = new RegExp(def.body.substring(REGEX.length));
    }
  } else {
    def.body = cloneDeepWith(def.body, (value) => {
      if (value && typeof value === 'string' && value.startsWith(REGEX)) {
        return new RegExp(value.substring(REGEX.length));
      } else {
        return undefined;
      }
    });
  }
};

export const vcrNock = (f, {
  mode, fixtures, fixtureName, prepareScope, opt,
}) => (req, res, next) => {
  nock.restore();
  nock.recorder.clear();
  nock.cleanAll();
  nock.activate();

  const ctx = {
    mode: mode || process.env.REPLAY || 'replay',
    opt: opt || {},
    fixtures: path.resolve(fixtures || './fixtures'),
    fixtureName: undefined, // process.env.AWS_LAMBDA_FUNCTION_NAME
    fixture: undefined,
    files: [],
    defs: undefined,
    nocks: undefined,
    prepareScope: [prepareBodyRegex, ...(prepareScope || [])],
  };

  if (fixtureName) {
    ctx.fixture = path.join(ctx.fixtures, `${fixtureName}.json`);
    if (fs.existsSync(ctx.fixture)) {
      ctx.files = [`${fixtureName}.json`];
    }
  } else if (fs.existsSync(ctx.fixtures)) {
    ctx.files = fs.readdirSync(ctx.fixtures);
  }
  ctx.defs = ctx.files.reduce((a, fixture) => [...a, ...nock.loadDefs(path.join(ctx.fixtures, fixture))], []);
  ctx.prepareScope.forEach((f2) => ctx.defs.forEach((def) => f2(def)));
  ctx.nocks = nock.define(ctx.defs);

  console.log(`Replay mode = ${ctx.mode}`);

  if (ctx.mode === 'record') {
    ctx.fixtureName = fixtureName || Date.now();
    ctx.fixture = path.join(ctx.fixtures, `${ctx.fixtureName}.json`);

    nock.recorder.rec({
      output_objects: true,
      logging: (content) => {
        console.log('content: ', content);
        fs.mkdirSync(path.dirname(ctx.fixture), { recursive: true });
        console.log('outputs: ', JSON.stringify(nock.recorder.play(), null, 2));
        fs.writeFileSync(ctx.fixture, JSON.stringify(nock.recorder.play(), null, 2));
      },
      ...ctx.opt,
    });
  } else if (ctx.mode === 'replay') {
    nock.disableNetConnect();
  } else {
    // mode is wild
  }

  next();
};

export const requestRelay = () => 'TODO';
export const eventRelay = () => 'TODO';
