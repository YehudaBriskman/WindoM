import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet } from '../lib/api';
import { useSettings } from '../contexts/SettingsContext';
import { GITHUB_POLL_INTERVAL_MS } from '../lib/timing-constants';

export interface GitHubSummary {
  notificationCount: number;
  reviewRequested: number;
  assignedIssues: number;
  username: string;
}

export function useGitHub() {
  const { settings } = useSettings();
  const githubConnected = settings.integrations.github.connected;
  const [summary, setSummary] = useState<GitHubSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await apiGet<GitHubSummary>('/github/summary');
      setSummary(data);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load GitHub';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!githubConnected) {
      setSummary(null);
      setError(null);
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    setLoading(true);
    void fetchSummary();
    pollRef.current = setInterval(() => { void fetchSummary(); }, GITHUB_POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [githubConnected, fetchSummary]);

  return { summary, loading, error, githubConnected };
}
