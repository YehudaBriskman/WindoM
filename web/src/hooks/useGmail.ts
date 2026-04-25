import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet } from '../lib/api';
import { useSettings } from '../contexts/SettingsContext';
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
  const gmailConnected = settings.integrations.gmail.connected;
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
