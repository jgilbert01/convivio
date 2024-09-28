export const handler = async (event, ctx) => {
  console.log('event: %j', event);
  console.log('ctx: %j', ctx);

  return {
    statusCode: 200,
  };
};
