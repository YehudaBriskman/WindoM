import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Weather.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Weather() {
  return (
    <DocsLayout path="/guide/weather" eyebrow="User Guide" title="Weather Widget">
      <h2>Overview</h2>

      <p>
        The weather widget shows live temperature and conditions in the top bar. It reads from Open-Meteo, which needs
        no API key and no account - there is nothing to sign up for and nothing to paste in.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            Open WindoM Settings → <strong>Weather</strong> tab.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Set <strong>Temperature Unit</strong> to Celsius (°C) or Fahrenheit (°F).
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            Start typing a city in the <strong>Location</strong> field (e.g. <code>Tel Aviv</code> or{' '}
            <code>New York</code>). Matching cities appear below the field with their region and country - click the one
            you mean.
          </p>
          <p>
            Or press <strong>Use my current location</strong> - only then does the browser ask whether WindoM may know
            your location. WindoM never asks on its own; until you set one, the widget shows{' '}
            <strong>Set location</strong>, which opens this tab. If you block the request, type a city instead.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          <p>
            The weather widget appears in the top-left of your new tab. There is no Save button - the change applies as
            soon as you pick it.
          </p>
        </div>
      </div>
      <div className="callout">
        <strong>Showing the wrong place?</strong> When you use your current location, WindoM falls back to a rough
        lookup from your IP address when the browser will not give coordinates, which can be a long way out on a VPN or
        a mobile connection. Type a city by hand to pin it.
      </div>
      <div className="callout tip">
        <strong>Refreshed every 30 minutes</strong> - the last reading is cached, so the widget is already filled in
        when a new tab opens and updates once the fresh reading arrives.
      </div>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
