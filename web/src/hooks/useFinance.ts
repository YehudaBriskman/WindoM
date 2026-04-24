import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface CryptoQuote {
  id: string;
  symbol: string;
  price: number;
  change24h: number;
}

interface FinanceCache {
  stocks: StockQuote[];
  crypto: CryptoQuote[];
  timestamp: number;
}

const CACHE_KEY = 'windom_finance_cache';
const TTL = 300_000; // 5 minutes
const POLL_MS = 300_000;

const CRYPTO_NAMES: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', cardano: 'ADA',
  ripple: 'XRP', dogecoin: 'DOGE', polkadot: 'DOT', chainlink: 'LINK',
  'avalanche-2': 'AVAX', 'matic-network': 'MATIC',
};

interface YahooQuote {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
}

async function fetchStocks(tickers: string[]): Promise<StockQuote[]> {
  const symbols = tickers.join(',');
  // Try query1 first, fall back to query2 if it fails
  let res = await fetch(`https://query1.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(symbols)}`);
  if (!res.ok) {
    res = await fetch(`https://query2.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(symbols)}`);
  }
  if (!res.ok) throw new Error(`Yahoo Finance ${res.status}`);
  const data = await res.json() as { quoteResponse?: { result?: YahooQuote[] } };
  return (data.quoteResponse?.result ?? [])
    .filter((q): q is YahooQuote & { regularMarketPrice: number } => typeof q.regularMarketPrice === 'number' && q.regularMarketPrice > 0)
    .map((q) => ({
      symbol: q.symbol.toUpperCase(),
      price: q.regularMarketPrice,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
    }));
}

async function fetchCrypto(ids: string[]): Promise<CryptoQuote[]> {
  const idsParam = ids.join(',');
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true`
  );
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const data = await res.json() as Record<string, { usd: number; usd_24h_change: number }>;
  return ids
    .filter((id) => data[id])
    .map((id) => ({
      id,
      symbol: CRYPTO_NAMES[id] ?? id.slice(0, 4).toUpperCase(),
      price: data[id].usd,
      change24h: data[id].usd_24h_change,
    }));
}

export function useFinance() {
  const { settings } = useSettings();
  const { finance } = settings.integrations;
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [crypto, setCrypto] = useState<CryptoQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enabled =
    (finance.showStocks && finance.watchlistTickers.length > 0) ||
    (finance.showCrypto && finance.cryptoWatchlist.length > 0);

  const fetchAll = useCallback(async (force = false) => {
    if (!enabled) return;

    const cached = await new Promise<FinanceCache | null>((resolve) => {
      chrome.storage.local.get(CACHE_KEY, (r) => resolve((r[CACHE_KEY] as FinanceCache | undefined) ?? null));
    });

    if (!force && cached && Date.now() - cached.timestamp < TTL) {
      setStocks(cached.stocks);
      setCrypto(cached.crypto);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [newStocks, newCrypto] = await Promise.all([
        finance.showStocks && finance.watchlistTickers.length > 0
          ? fetchStocks(finance.watchlistTickers)
          : Promise.resolve([]),
        finance.showCrypto && finance.cryptoWatchlist.length > 0
          ? fetchCrypto(finance.cryptoWatchlist)
          : Promise.resolve([]),
      ]);
      setStocks(newStocks);
      setCrypto(newCrypto);
      const cache: FinanceCache = { stocks: newStocks, crypto: newCrypto, timestamp: Date.now() };
      chrome.storage.local.set({ [CACHE_KEY]: cache });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, [enabled, finance.showStocks, finance.showCrypto, finance.watchlistTickers, finance.cryptoWatchlist]);

  useEffect(() => {
    if (!enabled) { setStocks([]); setCrypto([]); return; }
    void fetchAll();
    timerRef.current = setInterval(() => { void fetchAll(true); }, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [enabled, fetchAll]);

  return { stocks, crypto, loading, error };
}
