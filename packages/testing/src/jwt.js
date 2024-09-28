import { sign } from 'jsonwebtoken';

export const createJwt = ({
  headers = {
    jti: '412961c7-9c3e-4818-ae99-8e33c3005b2a',
  },
  claims = {
    sub: '72500806-8b0f-4f26-ae5b-2a829b011d6e',
  },
  options = {
    issuer: 'testing',
    audience: 'testing',
  },
  key = 'testing',
}) => sign({ ...headers, ...claims }, key, options);
