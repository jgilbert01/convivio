/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  AsyncSeriesHook,
} from 'tapable';

import { CorePlugin } from '../../../src/core';
import { ApiGatewayPlugin } from '../../../src/events/apigw';

import { APIGW } from '../fixtures/convivio';

const options = {
  stage: 'dev',
  region: 'us-west-2',
};

const config = {
  plugins: [
    new CorePlugin(options),
    new ApiGatewayPlugin(options),
  ],
};

const convivio = {
  options,
  config,
  hooks: {
    generate: new AsyncSeriesHook(['convivio', 'progress']),
  },
  yaml: APIGW,
  instanceId: '1732913736001',
};

convivio.config.plugins.forEach((p) => p.apply(convivio));

describe('events/apigw/index.js', () => {
  afterEach(sinon.restore);

  it('should generate template', async () => {
    await convivio.hooks.generate.promise(convivio);

    // console.log(JSON.stringify({ json: convivio.json }, null, 2));

    expect(convivio.json).to.deep.equal({
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'The AWS CloudFormation template for this Serverless application',
      Resources: {
        ApiGatewayRestApi: {
          Type: 'AWS::ApiGateway::RestApi',
          Properties: {
            Name: 'dev-my-bff-service', // TODO fix naming ???
            BinaryMediaTypes: [
              '*/*',
            ],
            EndpointConfiguration: {
              Types: [
                'PRIVATE',
              ],
              VpcEndpointIds: [
                'vpce-12345678901234567',
              ],
            },
            Policy: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: '*',
                  Action: [
                    'execute-api:Invoke',
                  ],
                  Resource: 'execute-api:/*/*/*',
                },
                {
                  Effect: 'Deny',
                  Principal: '*',
                  Action: [
                    'execute-api:Invoke',
                  ],
                  Resource: 'execute-api:/*/*/*',
                  Condition: {
                    StringNotEquals: {
                      'aws:SourceVpce': 'vpce-12345678901234567',
                    },
                  },
                },
              ],
            },
          },
        },
        ApiGatewayResourceProxyVar: {
          Type: 'AWS::ApiGateway::Resource',
          Properties: {
            ParentId: {
              'Fn::GetAtt': [
                'ApiGatewayRestApi',
                'RootResourceId',
              ],
            },
            PathPart: '{proxy+}',
            RestApiId: {
              Ref: 'ApiGatewayRestApi',
            },
          },
        },
        ApiGatewayMethodProxyVarAny: {
          Type: 'AWS::ApiGateway::Method',
          Properties: {
            HttpMethod: 'ANY',
            ResourceId: {
              Ref: 'ApiGatewayResourceProxyVar',
            },
            RestApiId: {
              Ref: 'ApiGatewayRestApi',
            },
            ApiKeyRequired: false,
            AuthorizationType: 'CUSTOM',
            AuthorizerId: {
              Ref: 'AuthorizerApiGatewayAuthorizer',
            },
            Integration: {
              IntegrationHttpMethod: 'POST',
              Type: 'AWS_PROXY',
              Uri: {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':apigateway:',
                    {
                      Ref: 'AWS::Region',
                    },
                    ':lambda:path/2015-03-31/functions/',
                    {
                      'Fn::GetAtt': [
                        'RestLambdaFunction',
                        'Arn',
                      ],
                    },
                    '/invocations',
                  ],
                ],
              },
            },
          },
          DependsOn: [
            'RestLambdaPermissionApiGateway',
            'AuthorizerApiGatewayAuthorizer',
          ],
        },
        AuthorizerApiGatewayAuthorizer: {
          Type: 'AWS::ApiGateway::Authorizer',
          Properties: {
            AuthorizerResultTtlInSeconds: 300,
            IdentitySource: 'method.request.header.Authorization',
            Name: 'authorizer',
            RestApiId: {
              Ref: 'ApiGatewayRestApi',
            },
            AuthorizerUri: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':apigateway:',
                  {
                    Ref: 'AWS::Region',
                  },
                  ':lambda:path/2015-03-31/functions/',
                  'arn:aws:lambda:us-west-2:123456789012:function:my-idm-service-dev-authorizer',
                  '/invocations',
                ],
              ],
            },
            Type: 'TOKEN',
          },
        },
        ApiGatewayDeployment1732913736001: {
          Type: 'AWS::ApiGateway::Deployment',
          Properties: {
            RestApiId: {
              Ref: 'ApiGatewayRestApi',
            },
            StageName: 'dev',
          },
        },
        RestLambdaPermissionApiGateway: {
          Type: 'AWS::Lambda::Permission',
          Properties: {
            FunctionName: {
              'Fn::GetAtt': [
                'RestLambdaFunction',
                'Arn',
              ],
            },
            Action: 'lambda:InvokeFunction',
            Principal: 'apigateway.amazonaws.com',
            SourceArn: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':execute-api:',
                  {
                    Ref: 'AWS::Region',
                  },
                  ':',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':',
                  {
                    Ref: 'ApiGatewayRestApi',
                  },
                  '/*/*',
                ],
              ],
            },
          },
        },
        AuthorizerLambdaPermissionApiGateway: {
          Type: 'AWS::Lambda::Permission',
          Properties: {
            FunctionName: 'arn:aws:lambda:us-west-2:123456789012:function:my-idm-service-dev-authorizer',
            Action: 'lambda:InvokeFunction',
            Principal: 'apigateway.amazonaws.com',
            SourceArn: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':execute-api:',
                  {
                    Ref: 'AWS::Region',
                  },
                  ':',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':',
                  {
                    Ref: 'ApiGatewayRestApi',
                  },
                  '/*/*',
                ],
              ],
            },
          },
        },
      },
      Outputs: {
        ServiceEndpoint: {
          Description: 'URL of the service endpoint',
          Value: {
            'Fn::Join': [
              '',
              [
                'https://',
                {
                  Ref: 'ApiGatewayRestApi',
                },
                '.execute-api.',
                { Ref: 'AWS::Region' },
                '.',
                { Ref: 'AWS::URLSuffix' },
                '/dev',
              ],
            ],
          },
        },
      },
      Conditions: {
      },
    });
  });
});
