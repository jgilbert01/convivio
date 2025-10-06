# @convivio/testing

This module provides client-side support for the `integration testing` of services built with [@Convivio](https://github.com/jgilbert01/convivio), which is a drop in replacement for the Serverless Framework (SF) v3.

## lambda-test
This module invokes your Lambda function in the local offline @convivio/simulator:

```
import { toKinesisRecords } from 'aws-lambda-stream';
import { lambdaTest } from '@convivio/testing';

const invoke = lambdaTest({ functionName: '${process.env.npm_package_name}-dev-listener' });

describe('listener/index.js', () => {
  it('should invoke the listener function', async () => {
    const res = await invoke(EVENT);
    expect(res.Payload).to.equal('Success');
  });
});

```

## jwt
This module help you create test JWTs that you can use when invoking your API Gateway based Lambda functions in the local offline @convivio/simulator:

```
import supertest from 'supertest';
import { createJwt } from '@convivio/testing';

const client = supertest('http://localhost:3001');
const JWT = createJwt({});

. . .
  it('should query', () => client.get('/things')
    .set('Authorization', JWT)
    .expect(200)
. . .
```
