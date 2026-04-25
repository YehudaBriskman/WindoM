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
const TTL = 300_000;
const POLL_MS = 300_000;

const CRYPTO_NAMES: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', cardano: 'ADA',
  ripple: 'XRP', dogecoin: 'DOGE', polkadot: 'DOT', chainlink: 'LINK',
  'avalanche-2': 'AVAX', 'matic-network': 'MATIC',
};

// ── Yahoo Finance v7 (primary — no crumb required) ────────────────────────────

interface YahooQuote {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
}

async function fetchStocksYahooV7(tickers: string[]): Promise<StockQuote[]> {
  const symbols = tickers.map(encodeURIComponent).join(',');
  const res = await fetch(
    `https://query1.finance.yahoo.com/v7/finance/quote?lang=en-US&region=US&corsDomain=finance.yahoo.com&symbols=${symbols}`
  );
  if (!res.ok) throw new Error(`Yahoo v7 ${res.status}`);

  const data = await res.json() as { quoteResponse?: { result?: YahooQuote[] } };
  const results = data.quoteResponse?.result ?? [];
  if (results.length === 0) throw new Error('Yahoo v7 empty');

  return results
    .filter((q): q is YahooQuote & { regularMarketPrice: number } =>
      typeof q.regularMarketPrice === 'number' && q.regularMarketPrice > 0)
    .map((q) => ({
      symbol: q.symbol.toUpperCase(),
      price: q.regularMarketPrice,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
    }));
}

// ── Yahoo Finance chart per symbol (fallback — no crumb required) ─────────────

interface YahooChartMeta {
  symbol?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  regularMarketChangePercent?: number;
}

async function fetchOneChart(ticker: string): Promise<StockQuote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`
    );
    if (!res.ok) return null;
    const data = await res.json() as { chart?: { result?: Array<{ meta: YahooChartMeta }> } };
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    const price = meta.regularMarketPrice;
    const prev  = meta.chartPreviousClose ?? price;
    const change = price - prev;
    const changePercent = meta.regularMarketChangePercent ?? (prev > 0 ? (change / prev) * 100 : 0);
    return { symbol: ticker.toUpperCase(), price, change, changePercent };
  } catch {
    return null;
  }
}

async function fetchStocksChart(tickers: string[]): Promise<StockQuote[]> {
  const results = await Promise.all(tickers.map(fetchOneChart));
  return results.filter((q): q is StockQuote => q !== null);
}

// ── Unified fetch with fallback ───────────────────────────────────────────────

async function fetchStocks(tickers: string[]): Promise<StockQuote[]> {
  try {
    const results = await fetchStocksYahooV7(tickers);
    if (results.length > 0) return results;
    throw new Error('empty');
  } catch {
    // v7 unavailable or empty — fall back to per-symbol chart API
    return fetchStocksChart(tickers);
  }
}

// ── CoinGecko (crypto) ────────────────────────────────────────────────────────

async function fetchCrypto(ids: string[]): Promise<CryptoQuote[]> {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true`
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

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFinance() {
  const { settings } = useSettings();
  const { finance } = settings.integrations;
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [crypto, setCrypto] = useState<CryptoQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTickersKey = useRef<string>('');
  const prevCryptoKey  = useRef<string>('');

  const tickersKey = finance.watchlistTickers.join(',');
  const cryptoKey  = finance.cryptoWatchlist.join(',');

  const enabled =
    (finance.showStocks && finance.watchlistTickers.length > 0) ||
    (finance.showCrypto  && finance.cryptoWatchlist.length  > 0);

  const fetchAll = useCallback(async (force = false) => {
    if (!enabled) return;

    const tickers   = tickersKey.split(',').filter(Boolean);
    const cryptoIds = cryptoKey.split(',').filter(Boolean);

    const cached = await new Promise<FinanceCache | null>((resolve) => {
      chrome.storage.local.get(CACHE_KEY, (r) =>
        resolve((r[CACHE_KEY] as FinanceCache | undefined) ?? null)
      );
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
        finance.showStocks && tickers.length   > 0 ? fetchStocks(tickers)   : Promise.resolve([]),
        finance.showCrypto && cryptoIds.length > 0 ? fetchCrypto(cryptoIds) : Promise.resolve([]),
      ]);
      setStocks(newStocks);
      setCrypto(newCrypto);
      chrome.storage.local.set({
        [CACHE_KEY]: { stocks: newStocks, crypto: newCrypto, timestamp: Date.now() },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, finance.showStocks, finance.showCrypto, tickersKey, cryptoKey]);

  useEffect(() => {
    if (!enabled) { setStocks([]); setCrypto([]); return; }
    // Force a live fetch whenever the watchlist changes so newly added items appear immediately
    const watchlistChanged = tickersKey !== prevTickersKey.current || cryptoKey !== prevCryptoKey.current;
    prevTickersKey.current = tickersKey;
    prevCryptoKey.current  = cryptoKey;
    void fetchAll(watchlistChanged);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => { void fetchAll(true); }, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [enabled, fetchAll, tickersKey, cryptoKey]);

  return { stocks, crypto, loading, error };
}
