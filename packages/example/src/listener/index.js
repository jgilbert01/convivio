import { App } from '../models/App';

export const handle = async (event, context) => {
  console.log('event: ', event);
  
  return App.handleFirst(event);

  // return;
};
