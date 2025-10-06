# @convivio/parse

This module implements the ```parse``` phase for [@Convivio](https://github.com/jgilbert01/convivio), which is a drop in replacement for the Serverless Framework (SF) v3.

As a drop in replacement, @convivio supports the SF v3 serverless.yml file structure. You can continue to name the file serverless.yml or you can switch to `convivio.yml`.

This plugin is responsible for parsing the yaml file and making it available for later processing phases. A significant part of the parsing phase revolves around resolving variables.

The following variables are supported _(so far)_:

## `${opt:}`
These variables provide access to the CLI options, such as:

* `${opt:stage}`
* `${opt:region}`

## `${env:}`
These variables provide access to the environment variables, such as:

* `${env:DEBUG}`

## `${self:}`
These variables provide access to the contents of the yaml file itself, such as:

* `${self:provider.environment.ENTITY_TABLE_NAME}`

## `${param:}`
These variables automatically apply the STAGE option to simplify the use of the variables throughout the yaml file, such as:

```
params:
  dev:
    logRetentionInDays: 3
  prd:
    logRetentionInDays: 30
 
. . .

provider:
  logRetentionInDays: ${param:logRetentionInDays}

```

## `${aws:}`
These variables provide access to the AWS STS caller identity:

* `${aws:accountId}`
* `${aws:partition}` // @convivio only
* `${aws:region}`

## `${awsdesc:}`

These variables provide access to the description of AWS resources, such as `DynamoDB.describeTable`. _(DynamoDB Only so far)_

```
provider:
  environment:
    ENTITY_TABLE_NAME: ${self:service}-${opt:stage}-entities
    TABLE_STREAM_ARN: ${awsdesc:DynamoDB.describeTable.TableName.${self:provider.environment.ENTITY_TABLE_NAME}.Table.LatestStreamArn}
```

## `${cf:}`
These variables provide access to AWS ClousFormation stack outputs, such as:

```
  USER_POOL: ${cf(us-west-2):${self:custom.subsys}-cognito-resources-${opt:stage}.userPoolArn, 'unknown'}
  BUS_NAME: ${cf:${self:custom.subsys}-event-hub-${opt:stage}.busName, 'unknown'}
  BUS_ARN: ${cf:${self:custom.subsys}-event-hub-${opt:stage}.busArn, 'unknown'}
  STREAM_ARN: ${cf:${self:custom.subsys}-event-hub-${opt:stage}.stream1Arn, 'unknown'}
```

This variable type supports the region argument, such as `${cf(us-west-2):`.

The last argument of all variables in the default value.

## `${file:}`
These variables support decomposing the yaml files into smaller files.
Only yaml files are supported _(so far)_, such as:

```
provider:
  deploymentBucket: ${file(cvo/cfn.yml):deploymentBucket}
  iam:
    deploymentRole: ${file(cvo/cfn.yml):deploymentRole}
    role: ${file(cvo/iam.yml):role}
  stackTags: ${file(cvo/tags.yml)}
  environment: ${file(cvo/config.yml):environment}

. . .

resources:
  - ${file(cvo/dynamodb.yml):resources}
```