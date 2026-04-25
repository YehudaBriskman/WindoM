import { useSettings } from '../../contexts/SettingsContext';
import { useFinance } from '../../hooks/useFinance';

function fmt(price: number): string {
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 1) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function FinanceStrip() {
  const { settings } = useSettings();
  const { finance } = settings.integrations;
  const { stocks, crypto, loading, error } = useFinance();

  const wantsStocks = finance.showStocks && finance.watchlistTickers.length > 0;
  const wantsCrypto = finance.showCrypto && finance.cryptoWatchlist.length > 0;

  if (!wantsStocks && !wantsCrypto) return null;

  // Show loading pill while first fetch is in progress
  if (loading && stocks.length === 0 && crypto.length === 0) {
    return (
      <div className="finance-strip">
        <div className="finance-strip-item" style={{ opacity: 0.5 }}>
          <span className="finance-strip-symbol" style={{ letterSpacing: 0 }}>Loading prices…</span>
        </div>
      </div>
    );
  }

  if (error && stocks.length === 0 && crypto.length === 0) {
    return (
      <div className="finance-strip">
        <div className="finance-strip-item" style={{ opacity: 0.5 }}>
          <span className="finance-strip-symbol" style={{ letterSpacing: 0, color: '#f87171' }}>Unable to load prices</span>
        </div>
      </div>
    );
  }

  const hasStocks = wantsStocks && stocks.length > 0;
  const hasCrypto = wantsCrypto && crypto.length > 0;

  if (!hasStocks && !hasCrypto) return null;

  return (
    <div className="finance-strip">
      {hasStocks && stocks.map((s) => {
        const positive = s.changePercent >= 0;
        return (
          <div key={s.symbol} className="finance-strip-item">
            <span className="finance-strip-symbol">{s.symbol}</span>
            <span className="finance-strip-price">{fmt(s.price)}</span>
            <span className={`finance-strip-change${positive ? ' positive' : ' negative'}`}>
              {positive ? '+' : ''}{s.changePercent.toFixed(2)}%
            </span>
          </div>
        );
      })}

      {hasStocks && hasCrypto && <div className="finance-strip-divider" />}

      {hasCrypto && crypto.map((c) => {
        const positive = c.change24h >= 0;
        return (
          <div key={c.id} className="finance-strip-item">
            <span className="finance-strip-symbol">{c.symbol}</span>
            <span className="finance-strip-price">{fmt(c.price)}</span>
            <span className={`finance-strip-change${positive ? ' positive' : ' negative'}`}>
              {positive ? '+' : ''}{c.change24h.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
