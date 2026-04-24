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
  const { stocks, crypto } = useFinance();

  const showStocks = finance.showStocks && stocks.length > 0;
  const showCrypto = finance.showCrypto && crypto.length > 0;

  if (!showStocks && !showCrypto) return null;

  return (
    <div className="finance-strip">
      {showStocks && stocks.map((s) => {
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

      {showStocks && showCrypto && <div className="finance-strip-divider" />}

      {showCrypto && crypto.map((c) => {
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
