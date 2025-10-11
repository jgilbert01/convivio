import debug from 'debug';

import { mergeResources } from '../../utils';

import restApi from './rest-api';
import resources from './resources';
import methods from './methods';
import authorizers from './authorizers';
import permissions from './permissions';
import deployment from './deployment';

const log = debug('cvo:gen:events:apigw');

export class ApiGatewayPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.generate.tapPromise(ApiGatewayPlugin.name, async (convivio) => {
      log('%j', { convivio });

      if (!convivio.yaml.functions) return;

      const functions = Object.values(convivio.yaml.functions);

      const http = functions
        .filter((f) => f.events)
        .flatMap(({ events, ...f }) => events
          .map((e) => ({
            function: f,
            http: e.http,
          })))
        .filter((e) => e.http);

      log('%j', { http });

      if (!http.length) return;

      const ctx = {};
      mergeResources(convivio.json, restApi(convivio, ctx));

      http.forEach((e) => {
        mergeResources(convivio.json, resources(e, convivio, ctx));
        mergeResources(convivio.json, methods(e, convivio, ctx));
        mergeResources(convivio.json, authorizers(e, convivio, ctx));
        mergeResources(convivio.json, permissions(e, convivio, ctx));
      });

      mergeResources(convivio.json, deployment(convivio, ctx));
    });
  }
}
