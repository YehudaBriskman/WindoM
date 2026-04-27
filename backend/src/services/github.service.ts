import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import { encryptToken, decryptToken } from '../lib/crypto.js';
import { GITHUB_API } from '../types/constants.js';
import type { Result } from '../types/auth.types.js';

export type GitHubError = 'NOT_CONNECTED' | 'INVALID_PAT' | 'GITHUB_API_ERROR';

export interface GitHubSummary {
  notificationCount: number;
  reviewRequested: number;
  assignedIssues: number;
  username: string;
}

interface GitHubUser {
  login: string;
}

interface GitHubSearchResult {
  total_count: number;
}

const GITHUB_TTL_MS = 60_000;
const githubCache = new Map<string, { data: Result<GitHubSummary, GitHubError>; expiresAt: number }>();

export function invalidateGithubCache(userId: string): void {
  githubCache.delete(userId);
}

export function clearGithubCacheForTest(): void {
  githubCache.clear();
}

export async function storePat(userId: string, rawPat: string): Promise<Result<{ username: string }, GitHubError>> {
  // Verify PAT and get GitHub username
  const userRes = await fetch(`${GITHUB_API}/user`, {
    headers: {
      Authorization: `token ${rawPat}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (userRes.status === 401 || userRes.status === 403) {
    return { ok: false, error: 'INVALID_PAT' };
  }
  if (!userRes.ok) {
    return { ok: false, error: 'GITHUB_API_ERROR' };
  }

  const userData = (await userRes.json()) as GitHubUser;
  const username = userData.login;

  const accessTokenEnc = await encryptToken(rawPat);

  // Upsert: delete existing then insert (avoids unique constraint issues)
  await db
    .delete(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, 'github')));

  await db.insert(oauthAccounts).values({
    userId,
    provider: 'github',
    providerUserId: username,
    accessTokenEnc,
    scopes: ['notifications', 'repo'],
  });

  invalidateGithubCache(userId);
  return { ok: true, data: { username } };
}

export async function getGithubSummary(userId: string): Promise<Result<GitHubSummary, GitHubError>> {
  const cached = githubCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const [account] = await db
    .select()
    .from(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, 'github')))
    .limit(1);

  if (!account) return { ok: false, error: 'NOT_CONNECTED' };

  const rawPat = await decryptToken(account.accessTokenEnc);

  const headers = {
    Authorization: `token ${rawPat}`,
    Accept: 'application/vnd.github+json',
  };

  const [notifRes, reviewRes, issueRes] = await Promise.all([
    fetch(`${GITHUB_API}/notifications?all=false&per_page=50`, { headers }),
    fetch(`${GITHUB_API}/search/issues?q=type:pr+review-requested:@me+state:open&per_page=1`, { headers }),
    fetch(`${GITHUB_API}/search/issues?q=assignee:@me+state:open+type:issue&per_page=1`, { headers }),
  ]);

  if (!notifRes.ok || !reviewRes.ok || !issueRes.ok) {
    const failed = [notifRes, reviewRes, issueRes].find((r) => !r.ok);
    if (failed?.status === 401) return { ok: false, error: 'INVALID_PAT' };
    return { ok: false, error: 'GITHUB_API_ERROR' };
  }

  const [notifData, reviewData, issueData] = await Promise.all([
    notifRes.json() as Promise<unknown[]>,
    reviewRes.json() as Promise<GitHubSearchResult>,
    issueRes.json() as Promise<GitHubSearchResult>,
  ]);

  const summary: GitHubSummary = {
    notificationCount: Array.isArray(notifData) ? notifData.length : 0,
    reviewRequested: reviewData.total_count ?? 0,
    assignedIssues: issueData.total_count ?? 0,
    username: account.providerUserId,
  };

  const result: Result<GitHubSummary, GitHubError> = { ok: true, data: summary };
  githubCache.set(userId, { data: result, expiresAt: Date.now() + GITHUB_TTL_MS });
  return result;
}
