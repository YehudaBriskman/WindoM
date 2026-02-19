import { useState, useRef, useCallback } from 'react';
import { Search, Globe } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

const ENGINES: Record<string, string> = {
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  brave: 'https://search.brave.com/search?q=',
};

/** Returns a navigable URL if input looks like a URL, otherwise empty string. */
function resolveAsUrl(input: string): string {
  const s = input.trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^localhost(:\d+)?(\/.*)?$/i.test(s)) return `http://${s}`;
  // domain-like: letters/digits/hyphens, a dot, a TLD of 2+ chars, optional port+path
  if (/^[a-zA-Z0-9]([a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/.test(s)) {
    return `https://${s}`;
  }
  return '';
}

export function SearchBar() {
  const { settings } = useSettings();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const navigate = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const url = resolveAsUrl(trimmed);
    if (url) {
      window.location.href = url;
    } else {
      const base = ENGINES[settings.searchEngine] ?? ENGINES.google;
      window.location.href = base + encodeURIComponent(trimmed);
    }
    setValue('');
  }, [value, settings.searchEngine]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') navigate();
      if (e.key === 'Escape') {
        setValue('');
        inputRef.current?.blur();
      }
    },
    [navigate],
  );

  if (!settings.showFocus) return null;

  const isUrl = !!resolveAsUrl(value);

  return (
    <div className="search-bar-container">
      <div className="search-bar-wrapper">
        <span className="search-bar-icon">
          {isUrl
            ? <Globe size={18} strokeWidth={1.8} />
            : <Search size={18} strokeWidth={1.8} />
          }
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search or enter URL..."
          className="search-bar-input"
          autoComplete="off"
          spellCheck={false}
        />
        {value && (
          <button className="search-bar-submit" onClick={navigate} tabIndex={-1} aria-label="Go">
            ↵
          </button>
        )}
      </div>
    </div>
  );
}
