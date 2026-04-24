import { useSettings } from '../../contexts/SettingsContext';
import { useFinance } from '../../hooks/useFinance';

function formatCryptoPrice(price: number): string {
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 1) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function CryptoWidget() {
  const { settings } = useSettings();
  const { finance } = settings.integrations;
  const { crypto } = useFinance();

  if (!finance.showCrypto || finance.cryptoWatchlist.length === 0) return null;
  if (crypto.length === 0) return null;

  return (
    <div className="crypto-strip">
      {crypto.map((c) => {
        const positive = c.change24h >= 0;
        return (
          <div key={c.id} className="crypto-strip-item">
            <span className="crypto-strip-symbol">{c.symbol}</span>
            <span className="crypto-strip-price">{formatCryptoPrice(c.price)}</span>
            <span className={`crypto-strip-change${positive ? ' positive' : ' negative'}`}>
              {positive ? '+' : ''}{c.change24h.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
