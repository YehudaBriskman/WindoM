import { useState } from 'react';
import { useSettings } from '../../../contexts/SettingsContext';

const POPULAR_CRYPTO = [
  { id: 'bitcoin', label: 'Bitcoin (BTC)' },
  { id: 'ethereum', label: 'Ethereum (ETH)' },
  { id: 'solana', label: 'Solana (SOL)' },
  { id: 'ripple', label: 'XRP' },
  { id: 'dogecoin', label: 'Dogecoin (DOGE)' },
  { id: 'cardano', label: 'Cardano (ADA)' },
  { id: 'avalanche-2', label: 'Avalanche (AVAX)' },
  { id: 'chainlink', label: 'Chainlink (LINK)' },
];

async function validateFinnhubKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKey}`
    );
    if (!res.ok) return false;
    const data = await res.json() as { c?: number };
    return typeof data.c === 'number' && data.c > 0;
  } catch {
    return false;
  }
}

export function FinanceSettings() {
  const { settings, update } = useSettings();
  const { finance } = settings.integrations;

  const [keyInput, setKeyInput] = useState(finance.finnhubApiKey);
  const [tickersInput, setTickersInput] = useState(finance.watchlistTickers.join(', '));
  const [validating, setValidating] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [saving, setSaving] = useState(false);

  const connected = finance.connected;

  function toggleCrypto(id: string) {
    const list = finance.cryptoWatchlist.includes(id)
      ? finance.cryptoWatchlist.filter((c) => c !== id)
      : [...finance.cryptoWatchlist, id];
    void update('integrations', {
      finance: { ...finance, cryptoWatchlist: list, connected: list.length > 0 || finance.showStocks },
    });
  }

  async function handleSaveStocks() {
    const key = keyInput.trim();
    const tickers = tickersInput.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean);
    if (!key) { setKeyError('API key is required'); return; }
    if (tickers.length === 0) { setKeyError('Add at least one ticker'); return; }

    setValidating(true);
    setKeyError('');
    const valid = await validateFinnhubKey(key);
    setValidating(false);

    if (!valid) { setKeyError('Invalid API key — check your Finnhub Access Token'); return; }

    setSaving(true);
    await update('integrations', {
      finance: {
        ...finance,
        finnhubApiKey: key,
        watchlistTickers: tickers,
        showStocks: true,
        connected: true,
      },
    });
    setSaving(false);
  }

  function handleDisableStocks() {
    void update('integrations', {
      finance: {
        ...finance,
        showStocks: false,
        connected: finance.showCrypto && finance.cryptoWatchlist.length > 0,
      },
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Stocks section ── */}
      <div className="settings-group">
        <label className="settings-label">Stocks — Finnhub</label>
        <p className="settings-hint" style={{ marginBottom: '10px' }}>
          Get a free API key at{' '}
          <a href="https://finnhub.io" target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.8)' }}>
            finnhub.io
          </a>
          .
        </p>

        {finance.showStocks ? (
          <div className="integration-card">
            <div className="integration-info">
              <div className="integration-name">Finnhub</div>
              <div className="integration-status connected">
                {finance.watchlistTickers.join(', ')}
              </div>
            </div>
            <button type="button" className="integration-disconnect-btn" onClick={handleDisableStocks}>
              Disable
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Finnhub Access Token"
              value={keyInput}
              onChange={(e) => { setKeyInput(e.target.value); setKeyError(''); }}
              className="settings-input"
              style={{ marginBottom: '8px', fontFamily: 'monospace', fontSize: '12px' }}
            />
            <input
              type="text"
              placeholder="Tickers, e.g. AAPL, TSLA, NVDA"
              value={tickersInput}
              onChange={(e) => setTickersInput(e.target.value)}
              className="settings-input"
              style={{ marginBottom: '8px' }}
            />
            {keyError && <p className="auth-field-error" style={{ marginBottom: '8px' }}>{keyError}</p>}
            <button
              type="button"
              className="integration-connect-btn"
              disabled={validating || saving || !keyInput.trim()}
              onClick={handleSaveStocks}
              style={{ width: '100%' }}
            >
              {validating ? 'Validating…' : saving ? 'Saving…' : 'Connect Stocks'}
            </button>
          </>
        )}
      </div>

      {/* ── Crypto section ── */}
      <div className="settings-group">
        <label className="settings-label">Crypto — CoinGecko (free, no key)</label>
        <div className="finance-crypto-grid">
          {POPULAR_CRYPTO.map((coin) => {
            const checked = finance.cryptoWatchlist.includes(coin.id);
            return (
              <label key={coin.id} className="finance-crypto-pill">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCrypto(coin.id)}
                  style={{ display: 'none' }}
                />
                <span className={`finance-crypto-label${checked ? ' checked' : ''}`}>
                  {coin.label}
                </span>
              </label>
            );
          })}
        </div>
        {finance.cryptoWatchlist.length > 0 && (
          <p className="settings-hint" style={{ marginTop: '8px' }}>
            {finance.cryptoWatchlist.length} coin{finance.cryptoWatchlist.length !== 1 ? 's' : ''} selected.
          </p>
        )}
        {finance.cryptoWatchlist.length > 0 && !finance.showCrypto && (
          <button
            type="button"
            className="integration-connect-btn"
            style={{ width: '100%', marginTop: '8px' }}
            onClick={() => update('integrations', { finance: { ...finance, showCrypto: true, connected: true } })}
          >
            Enable Crypto Widget
          </button>
        )}
        {finance.showCrypto && (
          <button
            type="button"
            className="integration-disconnect-btn"
            style={{ marginTop: '8px' }}
            onClick={() => update('integrations', {
              finance: { ...finance, showCrypto: false, connected: finance.showStocks },
            })}
          >
            Disable Crypto
          </button>
        )}
      </div>

      {connected && (
        <p className="settings-hint" style={{ opacity: 0.5 }}>
          Prices update every 60 seconds while the tab is open.
        </p>
      )}
    </div>
  );
}
