import _ from 'lodash';
import debug from 'debug';

import { factory } from '@convivio/connectors';

const log = debug('cvo:parse:resolvers:awsdesc');

/*
Variable resolver to describe AWS resources.
It describes a given resource and extracts variables.
In other words, it provides access to AWS Requests like the following examples.

```
factory('EventBridge')['describeEventBus']({ Name: 'default'}).Arn
factory('DynamoDB')['describeTable']({ TableName: 't1'}).Table.TableArn
```

## Yaml
```
provider:
  environment:
    BUS_ARN: ${awsdesc:EventBridge.describeEventBus.Name.default.Arn}
    ENTITY_TABLE_NAME: ${self:service}-${opt:stage}-entities
    TABLE_ARN: ${awsdesc:DynamoDB.describeTable.TableName.${self:provider.environment.ENTITY_TABLE_NAME}.Table.TableArn}
```
*/

export const resolveFromAwsDesc = (cvo) =>
  async ({ param, address, defaultValue }) => {
    log('%j', { param, address, defaultValue });

    const [service, describe, key, id, l1, l2] = address.split('.');
    log('%j', {
      service, describe, key, id, l1, l2,
    });

    const description = await factory(cvo.config.credentials, cvo.options.region, service)[describe]({
      [key]: id,
    });
    log('%j', { description });

    if (l2) {
      return {
        value: description[l1][l2],
      };
    }
    return {
      value: description[l1],
    };
  };
