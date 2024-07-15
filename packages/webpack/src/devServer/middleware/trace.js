import debug from 'debug';

const log = debug('cvo:offline:trace');

export const trace = (req, res, next) => {
  const {
    url, method, headers, params, body,
  } = req;
  res.on('finish', () => {
    log('%j', {
      url, method, params, body, headers, statusCode: res.statusCode,
    });
  });
  next();
};
