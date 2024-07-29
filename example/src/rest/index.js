import Model from '../models/thing';

const getThing = (req, res) => req.namespace.models.thing
  .get(req.params.id)
  .then((data) => res.status(200).json(data));

const saveThing = (req, res) => req.namespace.models.thing
  .save(req.params.id, req.body)
  .then((data) => res.status(200).json(data));

const api = require('lambda-api')({
  logger: {
    level: 'trace',
    access: true,
    detail: true,
    stack: true,
  },
});

const models = (req, res, next) => {
  // console.log('req: ', req);

  api.app({
    models: {
      thing: new Model({
      }),
    },
  });

  return next();
};

api.use(models);

api.get('/things/:id', getThing);
api.put('/things/:id', saveThing);

// eslint-disable-next-line import/prefer-default-export
export const handle = async (event, context) => {
  // console.log('event: ', event);
  // console.log('context: ', context);
  
  return api.run(event, context);

};

// import { App } from '../models/App';

// export const handle = async (event, context) => {
//   context.callbackWaitsForEmptyEventLoop = false;

//   // Do not return the promise as we use the callback
//   // This resolved promise would be be in the application library code in a real-world application and provide the results
//  return App.handleSecond(event) // eslint-disable-line promise/catch-or-return
//     .then(result => ({
//       statusCode: 200,
//       headers: {
//         'Content-Type': 'application/json;charset=utf-8'
//       },
//       body: JSON.stringify(result)
//     }));

//   return;
// };
