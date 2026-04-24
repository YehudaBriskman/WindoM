import { TrendingUp } from 'lucide-react';
import { useFinance } from '../../hooks/useFinance';
import { useSettings } from '../../contexts/SettingsContext';

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function ChangeLabel({ pct }: { pct: number }) {
  const positive = pct >= 0;
  return (
    <span className={`finance-change${positive ? ' positive' : ' negative'}`}>
      {positive ? '+' : ''}{pct.toFixed(2)}%
    </span>
  );
}

export function FinanceWidget() {
  const { settings } = useSettings();
  const { finance } = settings.integrations;
  const { stocks, loading } = useFinance();

  if (!finance.showStocks || !finance.connected) return null;

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header">
        <TrendingUp size={14} strokeWidth={1.8} />
        <span>Stocks</span>
      </div>

      {loading && stocks.length === 0 && (
        <p className="finance-loading">Loading…</p>
      )}

      {stocks.length > 0 && (
        <div className="finance-list">
          {stocks.map((s) => (
            <div key={s.symbol} className="finance-row">
              <span className="finance-symbol">{s.symbol}</span>
              <span className="finance-price">${formatPrice(s.price)}</span>
              <ChangeLabel pct={s.changePercent} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
