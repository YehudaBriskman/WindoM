import { describe, it, expect } from 'vitest';
import {
  githubPatStrategy,
  googleRefreshStrategy,
  parseStandardTokenResponse,
  spotifyPkceRefreshStrategy,
  spotifySharedAppRefreshStrategy,
} from '../token-refresh.strategies.js';
import { GOOGLE_TOKEN_URL, SPOTIFY_TOKEN_URL } from '../../types/constants.js';

describe('parseStandardTokenResponse', () => {
  it('reads access_token and expires_in', () => {
    expect(
      parseStandardTokenResponse({ access_token: 'a', expires_in: 3600, scope: 'x', token_type: 'Bearer' }),
    ).toEqual({ accessToken: 'a', expiresInSec: 3600 });
  });

  it.each([
    null,
    'not-an-object',
    {},
    { expires_in: 3600 },
    { access_token: 'a' },
    { access_token: '', expires_in: 3600 },
    { access_token: 'a', expires_in: 0 },
    { access_token: 'a', expires_in: -1 },
    { access_token: 'a', expires_in: '3600' },
  ])('rejects malformed response %#', (json) => {
    expect(parseStandardTokenResponse(json)).toBeNull();
  });
});

describe('googleRefreshStrategy', () => {
  const s = googleRefreshStrategy({ clientId: 'gid', clientSecret: 'gsecret' });

  it('is a refreshable google strategy posting to the Google token URL', () => {
    expect(s.provider).toBe('google');
    expect(s.refreshable).toBe(true);
    expect(s.refreshUrl).toBe(GOOGLE_TOKEN_URL);
  });

  it('sends client credentials in the body, no extra headers', () => {
    expect(s.buildHeaders()).toEqual({});
    expect(s.buildBody('rt').toString()).toBe(
      'grant_type=refresh_token&refresh_token=rt&client_id=gid&client_secret=gsecret',
    );
  });

  it('keeps empty credentials as empty fields', () => {
    const empty = googleRefreshStrategy({ clientId: '', clientSecret: '' });
    expect(empty.buildBody('rt').toString()).toBe(
      'grant_type=refresh_token&refresh_token=rt&client_id=&client_secret=',
    );
  });

  it('uses the standard response parser', () => {
    expect(s.parseResponse({ access_token: 't', expires_in: 10 })).toEqual({ accessToken: 't', expiresInSec: 10 });
    expect(s.parseResponse({})).toBeNull();
  });
});

describe('spotifySharedAppRefreshStrategy', () => {
  const s = spotifySharedAppRefreshStrategy({ clientId: 'sid', clientSecret: 'ssecret' });

  it('is a refreshable spotify strategy posting to the Spotify token URL', () => {
    expect(s.provider).toBe('spotify');
    expect(s.refreshable).toBe(true);
    expect(s.refreshUrl).toBe(SPOTIFY_TOKEN_URL);
  });

  it('authenticates with HTTP Basic and keeps credentials out of the body', () => {
    expect(s.buildHeaders()).toEqual({ Authorization: `Basic ${Buffer.from('sid:ssecret').toString('base64')}` });
    expect(s.buildBody('rt').toString()).toBe('grant_type=refresh_token&refresh_token=rt');
  });

  it('interpolates unset credentials as before the refactor', () => {
    const unset = spotifySharedAppRefreshStrategy({ clientId: undefined, clientSecret: undefined });
    expect(unset.buildHeaders()).toEqual({
      Authorization: `Basic ${Buffer.from('undefined:undefined').toString('base64')}`,
    });
  });

  it('uses the standard response parser', () => {
    expect(s.parseResponse({ access_token: 't', expires_in: 10 })).toEqual({ accessToken: 't', expiresInSec: 10 });
    expect(s.parseResponse({ access_token: 't' })).toBeNull();
  });
});

describe('spotifyPkceRefreshStrategy', () => {
  const s = spotifyPkceRefreshStrategy('users-client');

  it('is a refreshable spotify strategy posting to the Spotify token URL', () => {
    expect(s.provider).toBe('spotify');
    expect(s.refreshable).toBe(true);
    expect(s.refreshUrl).toBe(SPOTIFY_TOKEN_URL);
  });

  it("sends the user's client_id in the body and no Authorization header", () => {
    expect(s.buildHeaders()).toEqual({});
    expect(s.buildBody('rt').toString()).toBe('grant_type=refresh_token&refresh_token=rt&client_id=users-client');
  });
});

describe('githubPatStrategy', () => {
  it('reports that a GitHub PAT cannot be refreshed', () => {
    expect(githubPatStrategy).toEqual({ provider: 'github', refreshable: false });
  });
});
