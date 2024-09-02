import debug from 'debug';

// TODO maybe only pull in defaults if aap specific file is not found
// for app specific files they can use the merge util

// NO definitely merge/override
// ADD commands that are preprocessed

export const mergeConfig = (convivio) => {
  // default config
  const dc = require('./config')(convivio);
  // user config
  const uc = {}; // require(convivio.options.config)(convivio);

  return {
    ...dc,
    // ...uc,
    resolvers: {
      ...dc.resolvers,
      // ...uc.resolvers,
    },
    plugins: [
      ...dc.plugins,
      // ...uc.plugins,
    ]
  };
};


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
