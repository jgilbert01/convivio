import Connector from 'lambda-api-utils/lib/connectors/dynamodb';
import {
  logger,
  cors,
  getClaims/* , forRole */,
  errorHandler,
  // serializer,
  // validate,
} from 'lambda-api-utils';
import ThingModel from '../models/thing';
import ElementModel from '../models/element';
import {
  queryThings, getThing, saveThing, deleteThing,
} from './routes/thing';
import {
  saveElement, deleteElement,
} from './routes/element';

const api = require('lambda-api')({
  // isBase64: true,
  // headers: {
  //   'content-encoding': ['gzip'],
  // },
  // serializer: (body) => serializer(body),
  logger: {
    level: 'trace',
    access: true,
    detail: true,
    stack: true,
  },
});

const models = (req, res, next) => {
  const claims = getClaims(req.requestContext);
  const connector = new Connector({
    debug: req.namespace.debug,
    tableName: process.env.ENTITY_TABLE_NAME,
  });

  api.app({
    debug: req.namespace.debug,
    models: {
      thing: new ThingModel({
        debug: req.namespace.debug,
        connector,
        claims,
      }),
      element: new ElementModel({
        debug: req.namespace.debug,
        connector,
        claims,
      }),
    },
  });

  return next();
};

api.use(cors);
api.use(logger(api));
api.use(errorHandler);
api.use(models);

['', `/api-${process.env.PROJECT}`]
  .forEach((prefix) => api.register((api) => { // eslint-disable-line no-shadow
    api.get('/things', queryThings);
    api.get('/things/:id', getThing);
    api.put('/things/:id', /* forRole('power'), */ saveThing);
    api.delete('/things/:id', /* forRole('admin'), */ deleteThing);
    api.put('/things/:id/elements/:elementId', /* forRole('power'), */ saveElement);
    api.delete('/things/:id/elements/:elementId', /* forRole('admin'), */ deleteElement);
  }, { prefix }));

// eslint-disable-next-line import/prefer-default-export
export const handle = async (event, context) => api.run(event, context);
