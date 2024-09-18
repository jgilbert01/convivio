const { convivioDefaults } = require('@convivio/webpack');
const { merge } = require('webpack-merge');

module.exports = (env) => convivioDefaults(env)
    .map((config) => merge(config, {
    }));
