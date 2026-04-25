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

// ── Yahoo Finance (primary) ───────────────────────────────────────────────────

interface YahooQuote {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
}

let yahooCrumb: string | null = null;

async function getYahooCrumb(): Promise<string | null> {
  if (yahooCrumb) return yahooCrumb;
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      credentials: 'include',
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text !== 'null' && !text.includes('<html')) {
        yahooCrumb = text.trim();
        return yahooCrumb;
      }
    }
  } catch { /* ignore */ }
  return null;
}

async function fetchStocksYahoo(tickers: string[]): Promise<StockQuote[]> {
  const symbols = tickers.map(encodeURIComponent).join(',');
  const crumb = await getYahooCrumb();
  const crumbParam = crumb ? `&crumb=${encodeURIComponent(crumb)}` : '';

  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${symbols}${crumbParam}`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);

  const data = await res.json() as { quoteResponse?: { result?: YahooQuote[] } };
  const results = data.quoteResponse?.result ?? [];
  if (results.length === 0) throw new Error('Yahoo returned empty results');

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

// ── Stooq (fallback) ──────────────────────────────────────────────────────────

const YAHOO_TO_STOOQ: Record<string, string> = {
  '^GSPC': '^spx', '^DJI': '^dji', '^IXIC': '^ndq',
  '^NDX':  '^ndq', '^RUT': '^rut', '^VIX':  '^vix',
  '^FTSE': '^ftx', '^N225': '^nkx',
};

function toStooqSymbol(ticker: string): string {
  const upper = ticker.toUpperCase();
  if (YAHOO_TO_STOOQ[upper]) return YAHOO_TO_STOOQ[upper];
  if (upper.startsWith('^')) return upper.toLowerCase();
  return upper.toLowerCase().replace(/-/g, '.') + '.us';
}

async function fetchStocksStooq(tickers: string[]): Promise<StockQuote[]> {
  const stooqSymbols = tickers.map(toStooqSymbol);
  const reverseMap: Record<string, string> = {};
  tickers.forEach((t, i) => { reverseMap[stooqSymbols[i].toUpperCase()] = t.toUpperCase(); });

  const res = await fetch(`https://stooq.com/q/l/?s=${stooqSymbols.join(',')}&f=sd2cp&h&e=csv`);
  if (!res.ok) throw new Error(`Stooq ${res.status}`);

  const lines = (await res.text()).trim().split('\n');
  const results: StockQuote[] = [];
  for (let i = 1; i < lines.length; i++) {
    const [rawSym, , priceStr, pctStr] = lines[i].trim().split(',');
    const price = parseFloat(priceStr);
    const changePercent = parseFloat(pctStr);
    if (!isFinite(price) || price <= 0 || !isFinite(changePercent)) continue;
    const symbol = reverseMap[rawSym.trim().toUpperCase()] ?? rawSym.replace(/\.US$/i, '').toUpperCase();
    results.push({ symbol, price, change: price * (changePercent / 100), changePercent });
  }
  return results;
}

// ── Unified fetch with fallback ───────────────────────────────────────────────

async function fetchStocks(tickers: string[]): Promise<StockQuote[]> {
  try {
    const results = await fetchStocksYahoo(tickers);
    if (results.length > 0) return results;
    throw new Error('empty');
  } catch {
    // Yahoo Finance unavailable or returned no data — try Stooq
    return fetchStocksStooq(tickers);
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
    void fetchAll();
    timerRef.current = setInterval(() => { void fetchAll(true); }, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [enabled, fetchAll]);

  return { stocks, crypto, loading, error };
}
