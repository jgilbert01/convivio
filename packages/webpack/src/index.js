export * from './config';
export * from './compile';
export * from './devServer';
export * from './externals';

import debug from 'debug';

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
