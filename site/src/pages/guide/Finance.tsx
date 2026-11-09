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
      <h2>What each card shows</h2>
      <p>
        Each row has a symbol, a price and a percentage change. Prices are shown with a dollar sign (crypto prices are
        requested from CoinGecko in US dollars). In the <strong>Stocks</strong> card the percentage is the change
        reported for the current trading day; in the <strong>Crypto</strong> card it is the 24-hour change. Positive
        changes are marked with a plus sign. A card with more rows than fit can be scrolled on its own.
      </p>
      <p>
        A card appears only when it has something to show: at least one ticker (or coin) in its list and its{' '}
        <strong>Show</strong> toggle on. With nothing selected in either list, no Finance card is drawn at all.
      </p>

      <h2>The settings explained</h2>
      <ul>
        <li>
          <strong>Stocks</strong> - a search box backed by Yahoo Finance. Results are limited to stocks, ETFs, indices
          and mutual funds, up to eight at a time, and you can move through them with the arrow keys, pick with{' '}
          <kbd>Enter</kbd> and close the list with <kbd>Esc</kbd>. Selected tickers appear as small pills; the{' '}
          <strong>x</strong> on a pill removes it. Picking a ticker that is already selected removes it.
        </li>
        <li>
          <strong>Crypto</strong> - a fixed list of eight coins: Bitcoin (BTC), Ethereum (ETH), Solana (SOL), XRP,
          Dogecoin (DOGE), Cardano (ADA), Avalanche (AVAX) and Chainlink (LINK). Click a coin to track it, click again
          to stop. Prices are requested in US dollars.
        </li>
        <li>
          <strong>Show</strong> - appears next to <strong>Stocks</strong> or <strong>Crypto</strong> once that list has
          at least one entry. It hides the card without clearing your list.
        </li>
      </ul>
      <p>
        Both lists start empty, so nothing appears until you add something. Adding the first ticker or coin turns that
        card on automatically; removing the last one turns it off.
      </p>

      <h2>How it works</h2>
      <p>
        WindoM fetches your stocks and coins together and refreshes them every 5 minutes while the tab is open. Between
        refreshes the last result is cached on your device, so a new tab can show prices immediately instead of waiting.
        Changing either list skips the cache and fetches straight away.
      </p>
      <p>
        For stocks, WindoM asks Yahoo Finance for all your tickers in one request. If that request fails or returns
        nothing, it falls back to asking for each ticker separately and reads the latest price and previous close from
        the result. A ticker that cannot be priced is left out of the card rather than shown with a wrong number.
      </p>

      <h2>Where the data comes from</h2>
      <ul>
        <li>
          <strong>Yahoo Finance</strong> (<code>query1.finance.yahoo.com</code>) - stock search suggestions while you
          type in Settings, and stock, ETF and index prices. What is sent is the text you typed in the search box or the
          ticker symbols in your list.
        </li>
        <li>
          <strong>CoinGecko</strong> (<code>api.coingecko.com</code>) - crypto prices. What is sent is the identifiers
          of the coins you track.
        </li>
      </ul>
      <p>
        These are public services that need no key and no sign-in, and WindoM does not send them your name or account.
        Your watchlist itself is stored in your browser settings; it only reaches WindoM's own servers if you have a
        WindoM account and your settings sync. The <Link to="/privacy">privacy policy</Link> lists every service the
        extension contacts.
      </p>
      <div className="callout warn">
        <strong>Information, not advice.</strong> Prices are shown as the named services return them. WindoM does not
        guarantee that a value is current or complete, so do not rely on the dashboard for trading decisions.
      </div>

      <h2>Tips</h2>
      <ul>
        <li>Search by company name if you do not know the ticker; the symbol is shown next to each result.</li>
        <li>
          Keep the lists short. The cards are meant to be glanced at; a handful of tickers reads better than a long
          scroll.
        </li>
        <li>
          Pair the dashboard with a quieter layout from <Link to="/guide/templates">Layout Templates</Link>, or use{' '}
          <Link to="/guide/focus">Focus mode</Link> when you want the tab to stay out of the way.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <p>
        <strong>The card says "Unable to load".</strong> The services could not be reached, so there are no prices to
        show for that card. Check your connection and open a new tab; WindoM retries on its next 5-minute refresh.
      </p>
      <p>
        <strong>The card says "No data".</strong> The service answered but returned nothing usable for your list, for
        example a symbol Yahoo Finance does not price. Remove the symbol and search for it again.
      </p>
      <p>
        <strong>The card says "Loading…".</strong> This shows during the first fetch, before any prices exist.
      </p>
      <p>
        <strong>I added a coin and nothing appeared.</strong> Open the new tab again, or wait for the next refresh. If
        CoinGecko is unreachable, the Crypto card shows an error until it responds.
      </p>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/templates">Layout Templates</Link> - arrange the new tab around the dashboard
        </li>
        <li>
          <Link to="/guide/focus">Focus Timer</Link> - quiet the tab while you work
        </li>
        <li>
          <Link to="/guide/account">Account</Link> - settings sync across browsers
        </li>
        <li>
          <Link to="/privacy">Privacy policy</Link> and <Link to="/support">Support</Link>
        </li>
      </ul>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
