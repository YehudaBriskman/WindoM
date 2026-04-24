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

export function FinanceSettings() {
  const { settings, update } = useSettings();
  const { finance } = settings.integrations;

  const [tickersInput, setTickersInput] = useState(finance.watchlistTickers.join(', '));
  const [tickerError, setTickerError] = useState('');

  function toggleCrypto(id: string) {
    const list = finance.cryptoWatchlist.includes(id)
      ? finance.cryptoWatchlist.filter((c) => c !== id)
      : [...finance.cryptoWatchlist, id];
    const showCrypto = list.length > 0;
    void update('integrations', {
      finance: { ...finance, cryptoWatchlist: list, showCrypto, connected: showCrypto || finance.showStocks },
    });
  }

  function handleSaveStocks() {
    const tickers = tickersInput.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean);
    if (tickers.length === 0) { setTickerError('Add at least one ticker symbol'); return; }
    setTickerError('');
    void update('integrations', {
      finance: { ...finance, watchlistTickers: tickers, showStocks: true, connected: true },
    });
  }

  function handleDisableStocks() {
    setTickersInput('');
    void update('integrations', {
      finance: {
        ...finance,
        watchlistTickers: [],
        showStocks: false,
        connected: finance.showCrypto && finance.cryptoWatchlist.length > 0,
      },
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Stocks ── */}
      <div className="settings-group">
        <label className="settings-label">Stocks</label>
        <p className="settings-hint" style={{ marginBottom: '10px' }}>
          Free data via Yahoo Finance — no API key required. Shows in sidebar.
        </p>

        {finance.showStocks ? (
          <div className="integration-card">
            <div className="integration-info">
              <div className="integration-name">Stocks</div>
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
              placeholder="e.g. AAPL, TSLA, NVDA, MSFT"
              value={tickersInput}
              onChange={(e) => { setTickersInput(e.target.value); setTickerError(''); }}
              className="settings-input"
              style={{ marginBottom: '8px' }}
            />
            {tickerError && <p className="auth-field-error" style={{ marginBottom: '8px' }}>{tickerError}</p>}
            <button
              type="button"
              className="integration-connect-btn"
              disabled={!tickersInput.trim()}
              onClick={handleSaveStocks}
              style={{ width: '100%' }}
            >
              Enable Stocks
            </button>
          </>
        )}
      </div>

      {/* ── Crypto ── */}
      <div className="settings-group">
        <label className="settings-label">Crypto</label>
        <p className="settings-hint" style={{ marginBottom: '10px' }}>
          Free data via CoinGecko — no API key required. Shown on the main screen.
        </p>
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
            {finance.cryptoWatchlist.length} coin{finance.cryptoWatchlist.length !== 1 ? 's' : ''} selected — widget enabled automatically.
          </p>
        )}
      </div>

      <p className="settings-hint" style={{ opacity: 0.5 }}>
        Prices update every 5 minutes while the tab is open.
      </p>
    </div>
  );
}
