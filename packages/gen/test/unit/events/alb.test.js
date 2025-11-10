/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  AsyncSeriesHook,
} from 'tapable';

import { CorePlugin } from '../../../src/core';
import { AlbPlugin } from '../../../src/events/alb';

import { ALB } from '../fixtures/convivio';

const options = {
  stage: 'dev',
  region: 'us-west-2',
};

const config = {
  plugins: [
    new CorePlugin(options),
    new AlbPlugin(options),
  ],
};

const convivio = {
  options,
  config,
  hooks: {
    generate: new AsyncSeriesHook(['convivio', 'progress']),
  },
  yaml: ALB,
};

convivio.config.plugins.forEach((p) => p.apply(convivio));

describe('events/alb/index.js', () => {
  afterEach(sinon.restore);

  it('should generate template', async () => {
    await convivio.hooks.generate.promise(convivio);

    expect(convivio.json).to.deep.equal({
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'The AWS CloudFormation template for this Serverless application',
      Resources: {
        SpaAlbTargetGroup1234567890123456: {
          Type: 'AWS::ElasticLoadBalancingV2::TargetGroup',
          Properties: {
            TargetType: 'lambda',
            Targets: [
              {
                Id: {
                  'Fn::GetAtt': [
                    'SpaLambdaFunction',
                    'Arn',
                  ],
                },
              },
            ],
            Name: '1bfbbaecdfa01afcb6ec851a69c8aea7',
            Tags: [
              {
                Key: 'Name',
                Value: 'my-ui-main-spa-1234567890123456-dev',
              },
            ],
            TargetGroupAttributes: [
              {
                Key: 'lambda.multi_value_headers.enabled',
                Value: false,
              },
            ],
            HealthCheckEnabled: false,
            HealthCheckPath: '/',
            HealthCheckIntervalSeconds: 35,
            HealthCheckTimeoutSeconds: 30,
            HealthyThresholdCount: 5,
            UnhealthyThresholdCount: 5,
            Matcher: { HttpCode: '200' },
          },
          DependsOn: [
            'SpaLambdaPermissionRegisterTarget',
          ],
        },
        SpaAlbListenerRule40000: {
          Type: 'AWS::ElasticLoadBalancingV2::ListenerRule',
          Properties: {
            Actions: [
              {
                Type: 'forward',
                TargetGroupArn: {
                  Ref: 'SpaAlbTargetGroup1234567890123456',
                },
              },
            ],
            Conditions: [
              {
                Field: 'path-pattern',
                Values: [
                  '/*',
                ],
              },
              {
                Field: 'http-request-method',
                HttpRequestMethodConfig: {
                  Values: [
                    'GET',
                  ],
                },
              },
            ],
            ListenerArn: 'arn:aws:elasticloadbalancing:us-west-2:123456789012:listener/app/my-global-resources-stg/1234567890123456/6543210987654321',
            Priority: 40000,
          },
        },
        SpaLambdaPermissionAlb: {
          Type: 'AWS::Lambda::Permission',
          Properties: {
            FunctionName: {
              'Fn::GetAtt': [
                'SpaLambdaFunction',
                'Arn',
              ],
            },
            Action: 'lambda:InvokeFunction',
            Principal: 'elasticloadbalancing.amazonaws.com',
            SourceArn: {
              Ref: 'SpaAlbTargetGroup1234567890123456',
            },
          },
        },
        SpaLambdaPermissionRegisterTarget: {
          Type: 'AWS::Lambda::Permission',
          Properties: {
            FunctionName: {
              'Fn::GetAtt': [
                'SpaLambdaFunction',
                'Arn',
              ],
            },
            Action: 'lambda:InvokeFunction',
            Principal: 'elasticloadbalancing.amazonaws.com',
          },
        },
      },
      Outputs: {
      },
      Conditions: {
      },
    });
  });
});
