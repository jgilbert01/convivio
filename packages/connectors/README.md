# @convivio/connectors

This module provides the ```connectors``` for [@Convivio](https://github.com/jgilbert01/convivio), which is a drop in replacement for the Serverless Framework (SF) v3.

## Factory
Simplifies access to connectors throughout the system.
* [src/factory.js](src/factory.js)

## STS/Credentials
Supports `${aws:*}` variables and assume role credentials.
* [src/sts.js](src/sts.js)

## CloudFormation
Supports `${cf:*}` variables and deployments.
* [src/cloudformation.js](src/cloudformation.js)

## S3
Supports deployments.
* [src/s3.js](src/s3.js)

## DynamoDB
Supports `${awsdesc:*}` variables.
* [src/dynamodb.js](src/dynamodb.js)

## ACM
Supports plugin for deployment of certificates.
* [src/acn.js](src/acm.js)

## Secrets Manager
Supports plugin for deployment of secrets.
* [src/secretsmgr.js](src/secretsmgr.js)

