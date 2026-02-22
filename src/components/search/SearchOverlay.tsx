import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Globe, Clock, LayoutGrid, ChevronDown } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import type { Settings } from '../../types/settings';

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

const ENGINE_LABELS: Record<string, string> = {
  google: 'Google',
  bing: 'Bing',
  duckduckgo: 'DDG',
  brave: 'Brave',
};

const ENGINE_LIST: Settings['searchEngine'][] = ['google', 'bing', 'duckduckgo', 'brave'];

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
        if (t.url?.startsWith('chrome://') || t.url?.startsWith('chrome-extension://')) return false;
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

    if (Array.isArray(data) && Array.isArray((data as unknown[])[1])) {
      terms = ((data as unknown[])[1] as unknown[]).filter((t): t is string => typeof t === 'string');
    } else if (Array.isArray(data) && typeof (data as {phrase?: string}[])[0]?.phrase === 'string') {
      terms = (data as {phrase: string}[]).map(d => d.phrase).filter(Boolean);
    }

    return terms.slice(0, 5).map(term => ({ kind: 'search' as const, text: term }));
  } catch {
    return [];
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SearchOverlay() {
  const { settings, update } = useSettings();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [enginePickerOpen, setEnginePickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Global shortcut: Ctrl+Super+H (Ctrl+Meta+H)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.metaKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Auto-focus when opened; delay state reset so exit animation plays fully
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      const timer = setTimeout(() => {
        setValue('');
        setSuggestions([]);
        setActiveIdx(-1);
        setDropdownOpen(false);
        setEnginePickerOpen(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setActiveIdx(-1);
      return;
    }
    debounceRef.current = setTimeout(async () => {
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
      setOpen(false);
    },
    [value, settings.searchEngine],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dropdownOpen) { setDropdownOpen(false); setActiveIdx(-1); }
        else setOpen(false);
        return;
      }

      const hasDropdown = dropdownOpen && suggestions.length > 0;

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
    [dropdownOpen, suggestions, activeIdx, go],
  );

  const isUrl = !!resolveAsUrl(value);
  const showDropdown = dropdownOpen && suggestions.length > 0;

  return (
    <div
      className={`search-overlay-backdrop${open ? ' open' : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="search-overlay-box">
        <div className={`search-overlay-input-row${showDropdown ? ' dropdown-open' : ''}`}>
          <span className="search-bar-icon">
            {isUrl ? <Globe size={18} strokeWidth={1.8} /> : <Search size={18} strokeWidth={1.8} />}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setDropdownOpen(true); setActiveIdx(-1); }}
            onFocus={() => value.trim() && setDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search or enter URL..."
            className="search-bar-input"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="search-engine-pill-wrapper">
            <button
              className="search-engine-pill"
              onClick={() => setEnginePickerOpen(p => !p)}
              tabIndex={-1}
              type="button"
            >
              {ENGINE_LABELS[settings.searchEngine] ?? 'Google'}
              <ChevronDown size={11} strokeWidth={2} />
            </button>
            {enginePickerOpen && (
              <div className="search-engine-popover">
                {ENGINE_LIST.map(eng => (
                  <button
                    key={eng}
                    className={`search-engine-option${settings.searchEngine === eng ? ' active' : ''}`}
                    onMouseDown={e => {
                      e.preventDefault();
                      update('searchEngine', eng);
                      setEnginePickerOpen(false);
                      inputRef.current?.focus();
                    }}
                    type="button"
                  >
                    {ENGINE_LABELS[eng]}
                  </button>
                ))}
              </div>
            )}
          </div>
          {value && (
            <button
              className="search-bar-submit"
              onClick={() => activeIdx >= 0 ? go(suggestions[activeIdx].text, suggestions[activeIdx]) : go()}
              tabIndex={-1}
              type="button"
              aria-label="Go"
            >
              ↵
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="search-dropdown search-overlay-dropdown">
            {suggestions.map((s, i) => (
              <button
                key={`${s.kind}-${i}`}
                className={`search-suggestion${i === activeIdx ? ' active' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(-1)}
                onMouseDown={e => { e.preventDefault(); go(s.text, s); }}
                type="button"
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
