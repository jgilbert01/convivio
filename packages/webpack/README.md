# @convivio/webpack

This module implements the ```compile``` and ```packaging``` phases for [@Convivio](https://github.com/jgilbert01/convivio), which is a drop in replacement for the Serverless Framework (SF) v3.

This module also provides the Remocal (remote + local) @convivio/simulator for integration testing.


## compile and packaging

This module provides the replacement for the serverless-webpack plugin.

TODO

## remocal @convivio/simulator

This module provides the replacement for the serverless-offline plugin.

It is implemented using Webpack Dev Server.

> Philosophies: No simulator is perfect, so let's not go overboard. Let's do just enough to give us confidence to move forward to the non-prod environment and beyond.

The @convivio/simulator follows the remocal (remote + local) approach to integration testing.

First, clone the `template-bff-service` to sed your new service/stack.

Next, run `$ npm run dp:dev:w` to deploy your stack to your development environment. So far this is just the template code, but the resources, such as the DynmoDB table, are primarily boiler plate.

Now, your can refine the function code and run `$ REPLAY=record npm run test:int` to ensure that the calls to the resources are working properly. You be the judge on how to balance this integration testing with unit testing.

Here are the major things we are validating with this remocal integration testing:
* the convivio.yml is well formed
* the environment variables are setup properly
* sdk calls (and remote calls in general) are working properly

Supported functions/events:
* API Gateway
* ALB
* Invoke any functions, such as listeners, triggers, and crons

