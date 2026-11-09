import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Finance.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Finance() {
  return (
    <DocsLayout path="/guide/finance" eyebrow="User Guide" title="Finance Dashboard">
      <h2>Overview</h2>

      <p>
        Track live stock prices and crypto rates directly on your new tab. Prices update from Yahoo Finance and
        CoinGecko - no API key or account needed. Two scrollable cards appear on your dashboard: one for stocks, one for
        crypto.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            Open Settings → <strong>Apps</strong> → click the <strong>Finance</strong> card.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Under <strong>Stocks</strong>, type a company name or ticker in the search bar (e.g. "Apple" or "AAPL").
            Select from the autocomplete results. Repeat for each ticker you want.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            Under <strong>Crypto</strong>, toggle the coins you want to track (Bitcoin, Ethereum, Solana, and more).
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          <p>
            The Finance dashboards appear centered on your new tab. Each card is independently scrollable and has a
            show/hide toggle at the top.
          </p>
        </div>
      </div>
      <div className="callout tip">
        <strong>Prices cached for 5 minutes</strong> - adding a new ticker bypasses the cache immediately so you see the
        price right away.
      </div>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
