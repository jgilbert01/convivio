export const handle = async (event, context) => {
  console.log('event: %j', event);
  console.log('context: %j', context);
  return { event };
};
