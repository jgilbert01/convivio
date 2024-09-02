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

      const functions = Object.values(convivio.yaml.functions); // getFunctions(convivio);

      functions.forEach((f) => {
        mergeResources(convivio.json, logGroup(f, convivio));
      });

      mergeResources(convivio.json, iamRoleLambdaExecution(undefined, convivio));

      functions.forEach((f) => {
        mergeResources(convivio.json, lambdaFunction(f, convivio));
      });

      // functions.forEach((f) => {
      //   mergeResources(convivio.json, lambdaVersion(f, convivio));
      // });
    });
  }
}

// const getFunctions = (convivio) =>
//   // const env = convivio.yaml.provider.environment || {};
//   Object.entries(convivio.yaml.functions)
//     .map(([key, funct]) => {
//       funct.key = key;
//       funct.name = `${convivio.yaml.service}-${convivio.options.stage}-${key}`;
//       const handlerEntry = /(.*)\..*?$/.exec(funct.handler)[1];
//       funct.handlerEntry = { key: handlerEntry, value: `./${handlerEntry}.js` };
//       funct.package = {
//         artifact: `./.webpack/${key}.zip`,
//       };

//       // funct.environment: {
//       //   ...env,
//       //   ...(funct.environment || {}),
//       // };

//       return funct;
//     });
