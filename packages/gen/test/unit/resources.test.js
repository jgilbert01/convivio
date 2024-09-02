/* eslint no-template-curly-in-string: 0 */
import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  AsyncSeriesHook,
} from 'tapable';

import { CorePlugin } from '../../src/core';
import { ResourcesPlugin } from '../../src/resources';

import { CORE } from './fixtures/convivio';

const options = {};

const config = {
  plugins: [
    new CorePlugin(options),
    new ResourcesPlugin(options),
  ],
};

const convivio = {
  options,
  config,
  hooks: {
    generate: new AsyncSeriesHook(['convivio', 'progress']),
  },
  yaml: CORE,
};

convivio.config.plugins.forEach((p) => p.apply(convivio));

describe('resources/index.js', () => {
  afterEach(sinon.restore);

  it('should generate template', async () => {
    await convivio.hooks.generate.promise(convivio);

    expect(convivio.json).to.deep.equal({
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'The AWS CloudFormation template for this Serverless application',
      Resources: {
        EntitiesTable: {
          Type: 'AWS::DynamoDB::GlobalTable',
          Condition: 'IsWest',
          Properties: {
            TableName: 'template-dev-entities',
            AttributeDefinitions: [
              {
                AttributeName: 'pk',
                AttributeType: 'S',
              },
              {
                AttributeName: 'sk',
                AttributeType: 'S',
              },
              {
                AttributeName: 'discriminator',
                AttributeType: 'S',
              },
            ],
            KeySchema: [
              {
                AttributeName: 'pk',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'sk',
                KeyType: 'RANGE',
              },
            ],
            GlobalSecondaryIndexes: [
              {
                IndexName: 'gsi1',
                KeySchema: [
                  {
                    AttributeName: 'discriminator',
                    KeyType: 'HASH',
                  },
                  {
                    AttributeName: 'pk',
                    KeyType: 'RANGE',
                  },
                ],
                Projection: {
                  ProjectionType: 'ALL',
                },
              },
            ],
            Replicas: [
              {
                Region: 'us-west-2',
              },
              {
                Region: 'us-east-1',
              },
            ],
            BillingMode: 'PAY_PER_REQUEST',
            StreamSpecification: {
              StreamViewType: 'NEW_AND_OLD_IMAGES',
            },
            TimeToLiveSpecification: {
              AttributeName: 'ttl',
              Enabled: true,
            },
            SSESpecification: {
              SSEEnabled: true,
            },
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
