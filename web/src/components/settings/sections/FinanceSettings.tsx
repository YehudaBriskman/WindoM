import { useSettings } from '../../../contexts/SettingsContext';
import { StockSearch } from './StockSearch';

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

  function handleTickersChange(tickers: string[]) {
    void update('integrations', {
      finance: {
        ...finance,
        watchlistTickers: tickers,
        showStocks: tickers.length > 0,
        connected: tickers.length > 0 || finance.showCrypto,
      },
    });
  }

  function toggleCrypto(id: string) {
    const list = finance.cryptoWatchlist.includes(id)
      ? finance.cryptoWatchlist.filter((c) => c !== id)
      : [...finance.cryptoWatchlist, id];
    const showCrypto = list.length > 0;
    void update('integrations', {
      finance: {
        ...finance,
        cryptoWatchlist: list,
        showCrypto,
        connected: showCrypto || finance.showStocks,
      },
    });
  }

  function toggleShowStocks() {
    void update('integrations', {
      finance: { ...finance, showStocks: !finance.showStocks },
    });
  }

  function toggleShowCrypto() {
    void update('integrations', {
      finance: { ...finance, showCrypto: !finance.showCrypto },
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Stocks ── */}
      <div className="settings-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label className="settings-label" style={{ margin: 0 }}>Stocks</label>
          {finance.watchlistTickers.length > 0 && (
            <label className="settings-toggle-label" style={{ margin: 0 }}>
              <input
                type="checkbox"
                className="settings-toggle"
                checked={finance.showStocks}
                onChange={toggleShowStocks}
              />
              <span className="settings-toggle-track" />
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginLeft: '8px' }}>
                Show
              </span>
            </label>
          )}
        </div>
        <p className="settings-hint" style={{ marginBottom: '10px' }}>
          Free data via Yahoo Finance. Search by name or ticker symbol.
        </p>
        <StockSearch selected={finance.watchlistTickers} onChange={handleTickersChange} />
      </div>

      {/* ── Crypto ── */}
      <div className="settings-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label className="settings-label" style={{ margin: 0 }}>Crypto</label>
          {finance.cryptoWatchlist.length > 0 && (
            <label className="settings-toggle-label" style={{ margin: 0 }}>
              <input
                type="checkbox"
                className="settings-toggle"
                checked={finance.showCrypto}
                onChange={toggleShowCrypto}
              />
              <span className="settings-toggle-track" />
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginLeft: '8px' }}>
                Show
              </span>
            </label>
          )}
        </div>
        <p className="settings-hint" style={{ marginBottom: '10px' }}>
          Free data via CoinGecko.
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
      </div>

      <p className="settings-hint" style={{ opacity: 0.5 }}>
        Prices update every 5 minutes while the tab is open.
      </p>
    </div>
  );
}
