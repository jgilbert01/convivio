import debug from 'debug';

const log = debug('cvo:offline:routes:ping');

export default (devServer) => {
  devServer.app.get('/ping', (_, res) => {
    log('pong');
    res.send('pong');
  });
};
