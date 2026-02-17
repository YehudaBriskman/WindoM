import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { syncStorage } from '../lib/chrome-storage';
import { hashCode } from '../utils/hash';
import type { Quote, DailyQuoteCache } from '../types/quotes';

const FALLBACK_QUOTES: Quote[] = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'motivation' },
  { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs', category: 'innovation' },
  { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt', category: 'motivation' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill', category: 'perseverance' },
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

  const fetchAPIQuote = useCallback(async (): Promise<Quote> => {
    try {
      const res = await fetch('https://api.quotable.io/random');
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      return { text: data.content, author: data.author, category: data.tags?.[0] || 'wisdom' };
    } catch {
      const quotes = await loadLocalQuotes();
      return quotes[Math.floor(Math.random() * quotes.length)];
    }
  }, [loadLocalQuotes]);

  const displayQuote = useCallback(async () => {
    let q: Quote;
    if (settings.quoteSource === 'api') {
      q = await fetchAPIQuote();
    } else {
      const quotes = await loadLocalQuotes();
      q = await getDailyQuote(quotes);
    }
    // Fade animation
    setFading(true);
    setTimeout(() => {
      setQuote(q);
      setFading(false);
    }, 300);
  }, [settings.quoteSource, fetchAPIQuote, loadLocalQuotes, getDailyQuote]);

  const refresh = useCallback(async () => {
    await syncStorage.remove('dailyQuote');
    displayQuote();
  }, [displayQuote]);

  // Initial load
  useEffect(() => {
    if (settings.quotesEnabled) displayQuote();
  }, [settings.quotesEnabled, settings.quoteSource]); // eslint-disable-line react-hooks/exhaustive-deps

  // Schedule midnight rotation
  useEffect(() => {
    if (!settings.quotesEnabled) return;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const ms = tomorrow.getTime() - now.getTime();
    const id = setTimeout(() => displayQuote(), ms);
    return () => clearTimeout(id);
  }, [quote]); // eslint-disable-line react-hooks/exhaustive-deps

  return { quote, fading, refresh, enabled: settings.quotesEnabled };
}
