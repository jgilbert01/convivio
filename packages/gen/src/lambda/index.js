import debug from 'debug';

import { mergeResources } from '../utils';

import logGroup from './log-group';
import iamRoleLambdaExecution from './iam';
import lambdaFunction from './function';
// import lambdaVersion from './version';

const log = debug('cvo:gen:lambda');

export class LambdaPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.generate.tapPromise(LambdaPlugin.name, async (convivio) => {
      log('%j', { convivio });

      if (!convivio.yaml.functions) return;

      const functions = Object.values(convivio.yaml.functions);

      functions.forEach((f) => {
        mergeResources(convivio.json, logGroup(f, convivio));
      });

      mergeResources(convivio.json, iamRoleLambdaExecution(convivio, functions));

      functions.forEach((f) => {
        mergeResources(convivio.json, lambdaFunction(f, convivio));
      });

      // functions.forEach((f) => {
      //   mergeResources(convivio.json, lambdaVersion(f, convivio));
      // });
    });
  }
}
