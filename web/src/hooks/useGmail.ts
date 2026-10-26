import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet } from '../lib/api';
import { useSettings } from '../contexts/SettingsContext';
import { useGmailAvailable } from './useServerFeatures';
import { GMAIL_POLL_INTERVAL_MS } from '../lib/timing-constants';

export interface GmailMessage {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
}

export interface GmailSummary {
  unreadCount: number;
  messages: GmailMessage[];
}

export function useGmail() {
  const { settings } = useSettings();
  const gmailAvailable = useGmailAvailable();

  /**
   * Connected *and* still offered.
   *
   * `connected` is a saved setting, so for anyone who linked Gmail before the
   * widget was withdrawn it stays true indefinitely - and polling on the
   * strength of it alone meant a request every interval to an endpoint the
   * server answers 401 to by design. Before the session fix in #362 those 401s
   * were among the ones exhausting the refresh budget and logging people out.
   *
   * The server is the authority on what it will actually serve, so the saved
   * flag only decides whether the user *wants* the widget.
   */
  const gmailConnected = settings.integrations.gmail.connected && gmailAvailable;
  const [summary, setSummary] = useState<GmailSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await apiGet<GmailSummary>('/gmail/summary');
      setSummary(data);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load Gmail';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!gmailConnected) {
      setSummary(null);
      setError(null);
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    setLoading(true);
    void fetchSummary();
    pollRef.current = setInterval(() => { void fetchSummary(); }, GMAIL_POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [gmailConnected, fetchSummary]);

  return { summary, loading, error, gmailConnected };
}
