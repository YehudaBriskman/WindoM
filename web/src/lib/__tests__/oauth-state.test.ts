import { beforeEach, describe, expect, it } from 'vitest';
import { clearOAuthState, rememberOAuthState, validateAndConsumeOAuthState } from '../oauth-state';

beforeEach(() => sessionStorage.clear());

describe('OAuth state validation', () => {
  it('accepts the matching callback exactly once', () => {
    expect(rememberOAuthState('https://accounts.example/auth?state=secret-123', 'google')).toBe('secret-123');
    expect(() => validateAndConsumeOAuthState('secret-123', 'google')).not.toThrow();
    expect(() => validateAndConsumeOAuthState('secret-123', 'google')).toThrow(/missing or already used/);
  });

  it('rejects authorization URLs without state', () => {
    expect(() => rememberOAuthState('https://accounts.example/auth', 'google')).toThrow(/did not include state/);
  });

  it('rejects missing callback state and invalidates the flow', () => {
    rememberOAuthState('https://accounts.example/auth?state=expected', 'google');
    expect(() => validateAndConsumeOAuthState(null, 'google')).toThrow(/did not include state/);
    expect(() => validateAndConsumeOAuthState('expected', 'google')).toThrow(/missing or already used/);
  });

  it('rejects mismatched state and invalidates the flow', () => {
    rememberOAuthState('https://accounts.example/auth?state=expected', 'google');
    expect(() => validateAndConsumeOAuthState('attacker', 'google')).toThrow(/state mismatch/);
    expect(() => validateAndConsumeOAuthState('expected', 'google')).toThrow(/missing or already used/);
  });

  it('isolates simultaneous provider flows', () => {
    rememberOAuthState('https://accounts.example/auth?state=google-state', 'google');
    rememberOAuthState('https://accounts.example/auth?state=spotify-state', 'spotify');
    expect(() => validateAndConsumeOAuthState('spotify-state', 'spotify')).not.toThrow();
    expect(() => validateAndConsumeOAuthState('google-state', 'google')).not.toThrow();
  });

  it('clears an abandoned flow', () => {
    rememberOAuthState('https://accounts.example/auth?state=expected', 'spotify');
    clearOAuthState('spotify');
    expect(() => validateAndConsumeOAuthState('expected', 'spotify')).toThrow(/missing or already used/);
  });
});
