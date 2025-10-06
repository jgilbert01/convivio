# @convivio/testing

This module provides `client-side` support for the __Remocal__ (remote + local) _@convivio/simulator_, which allows you to perform `integration testing` on your services that you have built with [@Convivio](https://github.com/jgilbert01/convivio).

## lambda-test
This module invokes your non-API-Gateway based Lambda functions running in the remocal _@convivio/simulator_, such as listeners and triggers:

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

## JWT
This module help you create test JWTs that you can use when invoking your API Gateway based Lambda functions running in the remocal _@convivio/simulator_:

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
  });
. . .
```

## VCR
The _@convivio/simulator_ provides VCR support for __Remocal Integartion Testing__, by using [nock](https://www.npmjs.com/package/nock#nock-back) to record and play back the calls to your AWS resources, such as DynamoDB, S3, and EventBridge.

To record the integration tests for the `template-bff-service`, run the following command:

```
$> REPLAY=record npm run test:int
```

