import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import Promise from 'bluebird';
import debug from 'debug';

chai.use(sinonChai);

sinon.usingPromise(Promise);

debug.formatters.j = (v) => {
  try {
    const cache = [];
    return JSON.stringify(v, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.includes(value)) {
          return '[CIRCULAR]';
        } else {
          cache.push(value);
        }
      }
      return value;
    }, 2);
  } catch (error) {
    return `[UnexpectedJSONParseError]: ${error.message}`;
  }
};
