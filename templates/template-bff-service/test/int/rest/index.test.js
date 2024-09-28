import 'mocha';
import { expect } from 'chai';

import { createJwt } from '@convivio/testing';

const supertest = require('supertest');

const endpoint = process.env.ENDPOINT ? process.env.ENDPOINT : 'http://localhost:3001';
const client = supertest(endpoint);

const THING = {
  name: 'thing0',
  description: 'This is thing zero.',
};

describe('rest/index.js', () => {
  it('should save', () => client.put('/things/00000000-0000-0000-0000-000000000000')
    .send(THING)
    .set('Authorization', JWT)
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(res, null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({});
    }));

  it('should get', () => client.get('/things/00000000-0000-0000-0000-000000000000')
    .set('Authorization', JWT)
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(res, null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({
        id: '00000000-0000-0000-0000-000000000000',
        lastModifiedBy: '72500806-8b0f-4f26-ae5b-2a829b011d6e',
        timestamp: 1653877763001,
        ...THING,
      });
    }));

  it('should query', () => client.get('/things')
    .set('Authorization', JWT)
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(res, null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({
        data: [{
          id: '00000000-0000-0000-0000-000000000000',
          lastModifiedBy: '72500806-8b0f-4f26-ae5b-2a829b011d6e',
          timestamp: 1653877763001,
          ...THING,
        }],
      });
    }));

  it('should delete', () => client.delete('/things/00000000-0000-0000-0000-000000000000')
    .set('Authorization', JWT)
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(res, null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({});
    }));
});

const JWT = createJwt({});