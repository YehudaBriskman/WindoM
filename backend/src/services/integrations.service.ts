import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import type { OAuthProvider } from '../types/oauth.types.js';

export interface IntegrationsStatus {
  google: { connected: boolean; scopes: string[] };
  spotify: { connected: boolean; scopes: string[] };
}

export async function getIntegrations(userId: string): Promise<IntegrationsStatus> {
  const accounts = await db
    .select({ provider: oauthAccounts.provider, scopes: oauthAccounts.scopes })
    .from(oauthAccounts)
    .where(eq(oauthAccounts.userId, userId));

  const google = accounts.find((a) => a.provider === 'google');
  const spotify = accounts.find((a) => a.provider === 'spotify');

  return {
    google: { connected: !!google, scopes: google?.scopes ?? [] },
    spotify: { connected: !!spotify, scopes: spotify?.scopes ?? [] },
  };
}

export async function unlinkProvider(userId: string, provider: OAuthProvider): Promise<void> {
  await db
    .delete(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, provider)));
}
