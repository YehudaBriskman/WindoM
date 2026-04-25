import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface SearchResult {
  symbol: string;
  shortname: string;
}

interface Props {
  selected: string[];
  onChange: (tickers: string[]) => void;
}

const ALLOWED_TYPES = new Set(['EQUITY', 'ETF', 'INDEX', 'MUTUALFUND']);

async function searchYahoo(q: string): Promise<SearchResult[]> {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&enableFuzzyQuery=true`
  );
  if (!res.ok) return [];
  const data = await res.json() as {
    quotes?: Array<{ symbol: string; shortname?: string; longname?: string; quoteType?: string }>;
  };
  return (data.quotes ?? [])
    .filter((r) => r.symbol && ALLOWED_TYPES.has(r.quoteType ?? ''))
    .slice(0, 8)
    .map((r) => ({
      symbol: r.symbol,
      shortname: r.shortname ?? r.longname ?? r.symbol,
    }));
}

export function StockSearch({ selected, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const hits = await searchYahoo(q);
      setResults(hits);
      setActiveIndex(0);
      setOpen(hits.length > 0);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function toggle(symbol: string) {
    onChange(
      selected.includes(symbol)
        ? selected.filter((s) => s !== symbol)
        : [...selected, symbol]
    );
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      toggle(results[activeIndex].symbol);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {selected.length > 0 && (
        <div className="stock-pills">
          {selected.map((sym) => (
            <span key={sym} className="stock-pill">
              {sym}
              <button
                type="button"
                className="stock-pill-remove"
                onClick={() => onChange(selected.filter((s) => s !== sym))}
                aria-label={`Remove ${sym}`}
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div ref={wrapRef} style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          className="settings-input"
          placeholder={selected.length === 0 ? 'Search stocks, e.g. Apple, S&P 500, TSLA…' : 'Add another stock…'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {searching && (
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
            …
          </span>
        )}

        {open && results.length > 0 && (
          <div className="stock-dropdown">
            {results.map((r, i) => {
              const isSelected = selected.includes(r.symbol);
              return (
                <button
                  key={r.symbol}
                  type="button"
                  className={`stock-dropdown-item${isSelected ? ' selected' : ''}${i === activeIndex ? ' active' : ''}`}
                  onMouseDown={(e) => { e.preventDefault(); toggle(r.symbol); }}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <span className="stock-dropdown-symbol">{r.symbol}</span>
                  <span className="stock-dropdown-name">{r.shortname}</span>
                  {isSelected && <span className="stock-dropdown-check">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
