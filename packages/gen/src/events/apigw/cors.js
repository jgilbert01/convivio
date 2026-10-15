import _ from 'lodash';

import {
  normalizeName,
} from '../../utils';

import {
  getResourceLogicalId,
  normalizePath,
} from './resources';

export default (metadata, convivio, ctx) => {
  if (!metadata.http.cors) return {};

  ctx.resourceId = getResourceLogicalId(metadata.http.path);
  ctx.resourceName = normalizePath(metadata.http.path);
  ctx.corsMethodLogicalId = `ApiGatewayMethod${ctx.resourceName}${normalizeName('options')}`;
  ctx.apiGatewayMethodLogicalIds = [...(ctx.apiGatewayMethodLogicalIds || []), ctx.corsMethodLogicalId];

  metadata.http.cors = getCors(metadata.http);

  // ==============================

  if (!ctx.corsPreflight) ctx.corsPreflight = {};
  const cors = ctx.corsPreflight[metadata.http.path] || {};

  cors.headers = _.union(metadata.http.cors.headers, cors.headers);
  cors.methods = _.union(metadata.http.cors.methods, cors.methods);
  cors.origins = _.union(metadata.http.cors.origins, cors.origins);
  cors.origin = metadata.http.cors.origin;
  cors.allowCredentials = cors.allowCredentials || metadata.http.cors.allowCredentials;

  // when merging, last one defined wins
  if (metadata.http.cors.maxAge) {
    cors.maxAge = metadata.http.cors.maxAge;
  }

  if (metadata.http.cors.cacheControl) {
    cors.cacheControl = metadata.http.cors.cacheControl;
  }

  ctx.corsPreflight[metadata.http.path] = cors;

  // ==============================

  let { origin } = cors;
  let origins = cors.origins && Array.isArray(cors.origins) ? cors.origins : undefined;

  if (origin && origin.indexOf(',') !== -1) {
    origins = origin.split(',').map((a) => a.trim());
  }

  if (Array.isArray(origins) && origins.length) {
    origin = origins[0];
  }

  const preflightHeaders = {
    'Access-Control-Allow-Origin': `'${origin}'`,
    'Access-Control-Allow-Headers': `'${cors.headers.join(',')}'`,
    'Access-Control-Allow-Methods': `'${cors.methods.join(',')}'`,
  };

  if (cors.allowCredentials) {
    preflightHeaders['Access-Control-Allow-Credentials'] = `'${cors.allowCredentials}'`;
  }

  if (cors.maxAge) {
    preflightHeaders['Access-Control-Max-Age'] = `'${cors.maxAge}'`;
  }

  if (cors.cacheControl) {
    preflightHeaders['Cache-Control'] = `'${cors.cacheControl}'`;
  }

  if (cors.methods.includes('ANY')) {
    preflightHeaders['Access-Control-Allow-Methods'] = preflightHeaders[
      'Access-Control-Allow-Methods'
    ].replace('ANY', 'DELETE,GET,HEAD,PATCH,POST,PUT');
  }

  return {
    Resources: {
      [ctx.corsMethodLogicalId]: {
        Type: 'AWS::ApiGateway::Method',
        Properties: {
          AuthorizationType: 'NONE',
          HttpMethod: 'OPTIONS',
          MethodResponses: generateCorsMethodResponses(preflightHeaders),
          RequestParameters: {},
          Integration: {
            Type: 'MOCK',
            RequestTemplates: {
              'application/json': '{statusCode:200}',
            },
            ContentHandling: 'CONVERT_TO_TEXT',
            IntegrationResponses: generateCorsIntegrationResponses(
              preflightHeaders,
              origins,
            ),
          },
          ResourceId: {
            Ref: ctx.resourceId,
          },
          RestApiId: {
            Ref: ctx.restApiLogicalId,
          },
        },
      },
    },
  };
};

const NOT_FOUND = -1;

const getCors = (http) => {
  const headers = [
    'Content-Type',
    'X-Amz-Date',
    'Authorization',
    'X-Api-Key',
    'X-Amz-Security-Token',
    'X-Amz-User-Agent',
    'X-Amzn-Trace-Id',
  ];

  const cors = {
    origin: '*',
    methods: ['OPTIONS'],
    headers,
    allowCredentials: false,
  };

  if (typeof http.cors === 'object') {
    if (http.cors.origins) {
      delete cors.origin;
    }
    Object.assign(cors, http.cors);
    cors.methods = cors.methods || [];
    cors.allowCredentials = Boolean(cors.allowCredentials);

    const corsHeaders = cors.headers;
    if (corsHeaders) {
      if (typeof corsHeaders === 'string') {
        cors.headers = [corsHeaders];
      }
    } else {
      cors.headers = headers;
    }

    if (cors.methods.indexOf('OPTIONS') === NOT_FOUND) {
      cors.methods.push('OPTIONS');
    }

    if (cors.methods.indexOf(http.method.toUpperCase()) === NOT_FOUND) {
      cors.methods.push(http.method.toUpperCase());
    }
  } else {
    cors.methods.push(http.method.toUpperCase());
  }
  return cors;
};

const generateCorsMethodResponses = (preflightHeaders) => {
  const methodResponseHeaders = {};

  Object.keys(preflightHeaders).forEach((header) => {
    methodResponseHeaders[`method.response.header.${header}`] = true;
  });

  return [
    {
      StatusCode: '200',
      ResponseParameters: methodResponseHeaders,
      ResponseModels: {},
    },
  ];
};

const generateCorsIntegrationResponses = (preflightHeaders, origins) => {
  const responseParameters = _.mapKeys(
    preflightHeaders,
    (value, header) => `method.response.header.${header}`,
  );

  return [
    {
      StatusCode: '200',
      ResponseParameters: responseParameters,
      ResponseTemplates: {
        'application/json':
                    Array.isArray(origins) && origins.length
                      ? generateCorsResponseTemplate(origins)
                      : '',
      },
    },
  ];
};

const regexifyWildcards = (orig) => orig.map((str) => str.replace(/\./g, '[.]').replace('*', '.+'));

const generateCorsResponseTemplate = (origins) => {
  // glob pattern needs to be parsed into a Java regex
  // escape literal dots, replace wildcard * for .+
  const regexOrigins = regexifyWildcards(origins);

  return (
    '#set($origin = $input.params("Origin"))\n'
        + '#if($origin == "") #set($origin = $input.params("origin")) #end\n'
        + `#if(${regexOrigins
          .map((o, i, a) => `$origin.matches("${o}")${i < a.length - 1 ? ' || ' : ''}`)
          .join('')}`
        + ') #set($context.responseOverride.header.Access-Control-Allow-Origin = $origin) #end'
  );
};
