import { SignJWT, jwtVerify } from 'jose';
import { config } from '../config.js';

const ACCESS_TTL = '15m';
const accessSecret = new TextEncoder().encode(config.JWT_ACCESS_SECRET);

export interface AccessTokenPayload {
  sub: string; // user id
  email: string | null;
  name: string;
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(accessSecret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret, { algorithms: ['HS256'] });
  return {
    sub: payload.sub as string,
    email: (payload['email'] as string | null) ?? null,
    name: (payload['name'] as string) ?? '',
  };
}
