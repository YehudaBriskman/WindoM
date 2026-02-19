import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Globe, Clock, LayoutGrid } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type SuggestionKind = 'tab' | 'history' | 'search';

interface Suggestion {
  kind: SuggestionKind;
  text: string;
  subtext?: string;
  url?: string;
  tabId?: number;
  windowId?: number;
  favicon?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ENGINES: Record<string, string> = {
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  brave: 'https://search.brave.com/search?q=',
};

const hasChromeApi = typeof chrome !== 'undefined';

// ── URL detection ──────────────────────────────────────────────────────────────

function resolveAsUrl(input: string): string {
  const s = input.trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^localhost(:\d+)?(\/.*)?$/i.test(s)) return `http://${s}`;
  if (/^[a-zA-Z0-9]([a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/.test(s)) return `https://${s}`;
  return '';
}

// ── Suggestion fetchers ────────────────────────────────────────────────────────

async function getTabSuggestions(q: string): Promise<Suggestion[]> {
  try {
    if (!hasChromeApi || !chrome.tabs?.query) return [];
    const lower = q.toLowerCase();
    const tabs = await chrome.tabs.query({});
    return tabs
      .filter(t => {
        // skip internal chrome pages
        if (t.url?.startsWith('chrome://') || t.url?.startsWith('chrome-extension://')) return false;
        // match on URL OR title independently — don't require url to be truthy first
        const urlMatch = t.url?.toLowerCase().includes(lower) ?? false;
        const titleMatch = t.title?.toLowerCase().includes(lower) ?? false;
        return urlMatch || titleMatch;
      })
      .slice(0, 3)
      .map(t => ({
        kind: 'tab' as const,
        text: t.title || t.url || '',
        subtext: t.url,
        url: t.url,
        tabId: t.id,
        windowId: t.windowId,
        favicon: t.favIconUrl || undefined,
      }));
  } catch {
    return [];
  }
}

async function getHistorySuggestions(q: string, tabUrls: Set<string>): Promise<Suggestion[]> {
  try {
    if (!hasChromeApi || !chrome.history?.search) return [];
    const items = await chrome.history.search({ text: q, maxResults: 10 });
    return items
      .filter(item => item.url && !tabUrls.has(item.url))
      .slice(0, 4)
      .map(item => ({
        kind: 'history' as const,
        text: item.title || item.url || '',
        subtext: item.url,
        url: item.url,
      }));
  } catch {
    return [];
  }
}

async function getSearchSuggestions(q: string): Promise<Suggestion[]> {
  try {
    const res = await fetch(
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`,
      { signal: AbortSignal.timeout(2000) },
    );
    const data = await res.json() as unknown;

    let terms: string[] = [];

    // OpenSearch format: ["query", ["s1", "s2", ...]]
    if (Array.isArray(data) && Array.isArray((data as unknown[])[1])) {
      terms = ((data as unknown[])[1] as unknown[]).filter((t): t is string => typeof t === 'string');
    }
    // Object-array format: [{phrase: "s1"}, ...]
    else if (Array.isArray(data) && typeof (data as {phrase?: string}[])[0]?.phrase === 'string') {
      terms = (data as {phrase: string}[]).map(d => d.phrase).filter(Boolean);
    }

    return terms.slice(0, 5).map(term => ({ kind: 'search' as const, text: term }));
  } catch {
    return [];
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SearchBar() {
  const { settings } = useSettings();
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Focus: Chrome new-tab pages steal focus after load.
  // Retry every 100ms until the input is actually focused, up to ~2 seconds.
  // Also reclaim focus whenever the window re-receives focus.
  useEffect(() => {
    let cancelled = false;
    let tries = 0;

    function attempt() {
      if (cancelled || tries++ > 20) return;
      inputRef.current?.focus();
      if (document.activeElement !== inputRef.current) {
        setTimeout(attempt, 100);
      }
    }

    attempt();
    window.addEventListener('focus', attempt);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', attempt);
    };
  }, []);

  // ── Suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setActiveIdx(-1);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      // Each fetcher has its own try-catch, so one failure won't affect others
      const tabs = await getTabSuggestions(value);
      const tabUrls = new Set(tabs.map(t => t.url ?? '').filter(Boolean));
      const [history, searches] = await Promise.all([
        getHistorySuggestions(value, tabUrls),
        getSearchSuggestions(value),
      ]);
      setSuggestions([...tabs, ...history, ...searches]);
      setActiveIdx(-1);
    }, 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  // ── Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Navigation
  const go = useCallback(
    (overrideText?: string, suggestion?: Suggestion) => {
      if (suggestion?.kind === 'tab' && suggestion.tabId != null && hasChromeApi) {
        chrome.tabs.update(suggestion.tabId, { active: true });
        if (suggestion.windowId != null) chrome.windows.update(suggestion.windowId, { focused: true });
        setOpen(false);
        return;
      }
      const input = (overrideText ?? value).trim();
      if (!input) return;
      const url = suggestion?.url ?? resolveAsUrl(input);
      window.location.href = url || (ENGINES[settings.searchEngine] ?? ENGINES.google) + encodeURIComponent(input);
      setValue('');
      setOpen(false);
    },
    [value, settings.searchEngine],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const hasDropdown = open && suggestions.length > 0;

      if (e.key === 'Escape') {
        if (open) { setOpen(false); setActiveIdx(-1); }
        else setValue('');
        return;
      }

      if (!hasDropdown) {
        if (e.key === 'Enter') go();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => (i < suggestions.length - 1 ? i + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => (i > 0 ? i - 1 : -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIdx >= 0) go(suggestions[activeIdx].text, suggestions[activeIdx]);
        else go();
      }
    },
    [open, suggestions, activeIdx, go],
  );

  if (!settings.showFocus) return null;

  const isUrl = !!resolveAsUrl(value);
  const showDropdown = open && suggestions.length > 0;

  return (
    <div className="search-bar-container" ref={containerRef}>
      <div className="search-bar-inner">
        <div className={`search-bar-wrapper${showDropdown ? ' dropdown-open' : ''}`}>
          <span className="search-bar-icon">
            {isUrl ? <Globe size={18} strokeWidth={1.8} /> : <Search size={18} strokeWidth={1.8} />}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setOpen(true); setActiveIdx(-1); }}
            onFocus={() => value.trim() && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search or enter URL..."
            className="search-bar-input"
            autoComplete="off"
            spellCheck={false}
          />
          {value && (
            <button
              className="search-bar-submit"
              onClick={() => activeIdx >= 0 ? go(suggestions[activeIdx].text, suggestions[activeIdx]) : go()}
              tabIndex={-1}
              aria-label="Go"
            >
              ↵
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="search-dropdown">
            {suggestions.map((s, i) => (
              <button
                key={`${s.kind}-${i}`}
                className={`search-suggestion${i === activeIdx ? ' active' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(-1)}
                onMouseDown={e => { e.preventDefault(); go(s.text, s); }}
              >
                <span className="suggestion-icon">
                  {s.kind === 'tab' ? (
                    s.favicon
                      ? <img src={s.favicon} className="suggestion-favicon" alt="" />
                      : <LayoutGrid size={15} strokeWidth={1.8} />
                  ) : s.kind === 'history' ? (
                    <Clock size={15} strokeWidth={1.8} />
                  ) : (
                    <Search size={15} strokeWidth={1.8} />
                  )}
                </span>
                <span className="suggestion-text">
                  <span className="suggestion-label">{s.text}</span>
                  {s.subtext && <span className="suggestion-sub">{s.subtext}</span>}
                </span>
                {s.kind === 'tab' && <span className="suggestion-tab-badge">Switch</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
