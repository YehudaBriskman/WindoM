import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { syncStorage } from '../lib/chrome-storage';
import { hashCode } from '../utils/hash';
import { QUOTE_FADE_DURATION_MS } from '../lib/timing-constants';
import type { Quote, DailyQuoteCache } from '../types/quotes';

const FALLBACK_QUOTES: Quote[] = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'motivation' },
  { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs', category: 'innovation' },
  {
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
    category: 'motivation',
  },
  {
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
    category: 'perseverance',
  },
  { text: "Believe you can and you're halfway there.", author: 'Theodore Roosevelt', category: 'motivation' },
];

export function useQuotes() {
  const { settings } = useSettings();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [fading, setFading] = useState(false);
  const quotesRef = useRef<Quote[]>([]);

  const loadLocalQuotes = useCallback(async () => {
    if (quotesRef.current.length > 0) return quotesRef.current;
    try {
      const res = await fetch('/data/quotes.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Quote[] = await res.json();
      quotesRef.current = data;
      return data;
    } catch {
      quotesRef.current = FALLBACK_QUOTES;
      return FALLBACK_QUOTES;
    }
  }, []);

  const getDailyQuote = useCallback(async (quotes: Quote[]): Promise<Quote> => {
    const today = new Date().toDateString();
    const cached = await syncStorage.get<DailyQuoteCache | null>('dailyQuote', null);
    if (cached && cached.date === today) return cached.quote;

    const seed = hashCode(today);
    const index = Math.abs(seed) % quotes.length;
    const q = quotes[index];
    await syncStorage.set('dailyQuote', { date: today, quote: q });
    return q;
  }, []);

  const showQuote = useCallback((next: Quote) => {
    // Fade animation
    setFading(true);
    setTimeout(() => {
      setQuote(next);
      setFading(false);
    }, QUOTE_FADE_DURATION_MS);
  }, []);

  const displayQuote = useCallback(async () => {
    const quotes = await loadLocalQuotes();
    showQuote(await getDailyQuote(quotes));
  }, [loadLocalQuotes, getDailyQuote, showQuote]);

  /**
   * A click shows a different quote from the local list. It is not saved: the
   * day's quote (the cache above) is untouched, so tomorrow, or the next tab,
   * starts from the date-seeded pick again.
   */
  const refresh = useCallback(async () => {
    const quotes = await loadLocalQuotes();
    const others = quotes.filter((q) => q.text !== quote?.text);
    if (others.length === 0) return;
    showQuote(others[Math.floor(Math.random() * others.length)]);
  }, [loadLocalQuotes, quote, showQuote]);

  // Initial load
  useEffect(() => {
    if (settings.widgets.showQuotes) displayQuote();
  }, [settings.widgets.showQuotes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Schedule midnight rotation
  useEffect(() => {
    if (!settings.widgets.showQuotes) return;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const ms = tomorrow.getTime() - now.getTime();
    const id = setTimeout(() => displayQuote(), ms);
    return () => clearTimeout(id);
  }, [settings.widgets.showQuotes, displayQuote]);

  return { quote, fading, refresh, enabled: settings.widgets.showQuotes };
}
