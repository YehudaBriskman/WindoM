import { useState } from 'react';
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
  const { stocks, crypto, loading } = useFinance();
  const [tab, setTab] = useState<'stocks' | 'crypto'>('stocks');

  if (!finance.connected) return null;
  const hasBoth = finance.showStocks && finance.showCrypto;
  const activeTab = hasBoth ? tab : (finance.showStocks ? 'stocks' : 'crypto');
  const items = activeTab === 'stocks' ? stocks : crypto;

  if (!finance.showStocks && !finance.showCrypto) return null;

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header">
        <TrendingUp size={14} strokeWidth={1.8} />
        <span>Finance</span>
        {hasBoth && (
          <div className="finance-tabs">
            <button
              className={`finance-tab${activeTab === 'stocks' ? ' active' : ''}`}
              onClick={() => setTab('stocks')}
            >
              Stocks
            </button>
            <button
              className={`finance-tab${activeTab === 'crypto' ? ' active' : ''}`}
              onClick={() => setTab('crypto')}
            >
              Crypto
            </button>
          </div>
        )}
      </div>

      {loading && items.length === 0 && (
        <p className="finance-loading">Loading…</p>
      )}

      {items.length > 0 && (
        <div className="finance-list">
          {activeTab === 'stocks' && stocks.map((s) => (
            <div key={s.symbol} className="finance-row">
              <span className="finance-symbol">{s.symbol}</span>
              <span className="finance-price">${formatPrice(s.price)}</span>
              <ChangeLabel pct={s.changePercent} />
            </div>
          ))}
          {activeTab === 'crypto' && crypto.map((c) => (
            <div key={c.id} className="finance-row">
              <span className="finance-symbol">{c.symbol}</span>
              <span className="finance-price">${formatPrice(c.price)}</span>
              <ChangeLabel pct={c.change24h} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
