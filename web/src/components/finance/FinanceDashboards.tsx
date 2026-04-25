import { useSettings } from '../../contexts/SettingsContext';
import { useFinance } from '../../hooks/useFinance';

function fmt(price: number): string {
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 1) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function LoadingRow() {
  return (
    <div className="finance-dashboard-empty" style={{ opacity: 0.4 }}>
      Loading…
    </div>
  );
}

function ErrorRow() {
  return (
    <div className="finance-dashboard-empty" style={{ color: '#f87171' }}>
      Unable to load
    </div>
  );
}

export function FinanceDashboards() {
  const { settings } = useSettings();
  const { finance } = settings.integrations;
  const { stocks, crypto, loading, error } = useFinance();

  const wantsStocks = finance.showStocks && finance.watchlistTickers.length > 0;
  const wantsCrypto = finance.showCrypto && finance.cryptoWatchlist.length > 0;

  if (!wantsStocks && !wantsCrypto) return null;

  const isFirstLoad = loading && stocks.length === 0 && crypto.length === 0;

  return (
    <div className="finance-dashboards">
      {wantsStocks && (
        <div className="finance-dashboard">
          <div className="finance-dashboard-header">
            <span className="finance-dashboard-title">Stocks</span>
          </div>
          <div className="finance-dashboard-scroll">
            {isFirstLoad ? (
              <LoadingRow />
            ) : error && stocks.length === 0 ? (
              <ErrorRow />
            ) : stocks.length === 0 ? (
              <div className="finance-dashboard-empty">No data</div>
            ) : (
              stocks.map((s) => {
                const positive = s.changePercent >= 0;
                return (
                  <div key={s.symbol} className="finance-dashboard-row">
                    <span className="finance-dashboard-sym">{s.symbol}</span>
                    <span className="finance-dashboard-price">{fmt(s.price)}</span>
                    <span className={`finance-dashboard-change${positive ? ' positive' : ' negative'}`}>
                      {positive ? '+' : ''}{s.changePercent.toFixed(2)}%
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {wantsCrypto && (
        <div className="finance-dashboard">
          <div className="finance-dashboard-header">
            <span className="finance-dashboard-title">Crypto</span>
          </div>
          <div className="finance-dashboard-scroll">
            {isFirstLoad ? (
              <LoadingRow />
            ) : error && crypto.length === 0 ? (
              <ErrorRow />
            ) : crypto.length === 0 ? (
              <div className="finance-dashboard-empty">No data</div>
            ) : (
              crypto.map((c) => {
                const positive = c.change24h >= 0;
                return (
                  <div key={c.id} className="finance-dashboard-row">
                    <span className="finance-dashboard-sym">{c.symbol}</span>
                    <span className="finance-dashboard-price">{fmt(c.price)}</span>
                    <span className={`finance-dashboard-change${positive ? ' positive' : ' negative'}`}>
                      {positive ? '+' : ''}{c.change24h.toFixed(2)}%
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
