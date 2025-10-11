import debug from 'debug';

const log = debug('cvo:offline:routes:404');

export default (devServer) => {
  devServer.app.all('*', (req, res) => {
    const { url } = req;
    log('%j', { url });
    res.status(404).send({
      // FunctionError: 'ResourceNotFoundException',
      // Payload: {
      Message: `Function not found: ${url.replace('/2015-03-31/functions/', '').replace('/invocations', '')}`,
      //   Type: 'User',
      // },
      // StatusCode: 404,
    });
  });
};
