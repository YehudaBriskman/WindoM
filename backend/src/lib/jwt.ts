import { SignJWT, jwtVerify } from 'jose';
import { config } from '../config.js';

const ACCESS_TTL = '15m';
const accessSecret = new TextEncoder().encode(config.JWT_ACCESS_SECRET);

export interface AccessTokenPayload {
  sub: string; // user id
  email: string | null;
  name: string;
  emailVerified: boolean;
  /** The refresh session this access token was issued with; absent on pre-claim tokens. */
  sid?: string;
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  const claims: Record<string, unknown> = {
    email: payload.email,
    name: payload.name,
    emailVerified: payload.emailVerified,
  };
  if (payload.sid) claims['sid'] = payload.sid;
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .setIssuer('windom-api')
    .setAudience('windom-extension')
    .sign(accessSecret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret, {
    algorithms: ['HS256'],
    issuer: 'windom-api',
    audience: 'windom-extension',
  });
  return {
    sub: payload.sub as string,
    email: (payload['email'] as string | null) ?? null,
    name: (payload['name'] as string) ?? '',
    emailVerified: (payload['emailVerified'] as boolean) ?? false,
    ...(typeof payload['sid'] === 'string' ? { sid: payload['sid'] } : {}),
  };
}
