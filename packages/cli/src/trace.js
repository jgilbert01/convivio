import debug from 'debug';
import Promise from 'bluebird';

const log = debug('cvo:cli:trace');

class TracePlugin {
  constructor(options) {
    this.options = options;
    log('constructor');
  }

  apply(convivio) {
    log('apply');
    convivio.hooks.parse.tapPromise(TracePlugin.name, (...args) => {
      log('%j', { args });
      return Promise.delay(1000);
    });
    convivio.hooks.compile.tapPromise(TracePlugin.name, (...args) => {
      log('%j', { args });
      return Promise.delay(1000);
    });
    convivio.hooks.package.tapPromise(TracePlugin.name, (...args) => {
      log('%j', { args });
      return Promise.delay(1000);
    });
    convivio.hooks.deploy.tapPromise(TracePlugin.name, (...args) => {
      log('%j', { args });
      return Promise.delay(1000);
    });

    // convivio.hooks.package.intercept({
    //   register: (...args) => {
    //     log('%j', { register: args });
    //   },
    //   tap: (...args) => {
    //     log('%j', { tap: args });
    //   },
    //   call: (...args) => {
    //     log('%j', { call: args });
    //   },
    //   loop: (...args) => {
    //     log('%j', { loop: args });
    //   },
    // });
  }
};

export default TracePlugin;
