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
      <h2>How it works</h2>
      <p>
        On each new tab the widget first shows the last reading it saved, if that reading is under 30 minutes old, then
        fetches a fresh one and replaces it. While the tab stays open it refreshes again every 30 minutes. The widget is
        a small circle with the temperature and unit; hover over it to expand it and see an icon for the conditions, the
        city and a short condition label such as <code>Clear</code>, <code>Rain</code> or <code>Snow</code>.
      </p>
      <p>
        Open-Meteo reports a numeric weather code. WindoM turns it into one of these labels: Clear, Partly Cloudy,
        Clouds, Fog, Drizzle, Rain, Snow or Thunderstorm, and picks a day or night icon from the same reading.
      </p>

      <h2>The settings explained</h2>
      <ul>
        <li>
          <strong>Temperature Unit</strong> - Fahrenheit (°F) or Celsius (°C). The default is Fahrenheit. Changing it
          converts the saved reading right away, so the number updates without waiting for a refresh.
        </li>
        <li>
          <strong>Location</strong> - a city name. Suggestions start after two characters, wait for a short pause in
          your typing, and list up to six cities with their region and country. Picking one saves the city name; the
          widget then looks up that city's coordinates and uses the best match. Clearing the field goes back to your
          current location. If a typed city cannot be found, the widget shows <strong>City not found</strong>.
        </li>
        <li>
          <strong>Use my current location</strong> - asks the browser for your position. It is the only place WindoM
          ever asks. Once allowed, the field is cleared and Settings shows <strong>Using your current location.</strong>
        </li>
        <li>
          The widget can be hidden entirely with the <strong>Weather</strong> toggle in Settings → General; it is shown
          by default.
        </li>
      </ul>

      <h2>Where your data comes from and what leaves your device</h2>
      <p>The weather widget contacts only the services it needs, and only for the options you use:</p>
      <ul>
        <li>
          <strong>Open-Meteo</strong> (<code>api.open-meteo.com</code>) - the current temperature, conditions and
          day/night flag. What is sent is the latitude and longitude of the chosen place and the unit you picked.
        </li>
        <li>
          <strong>Open-Meteo geocoding</strong> (<code>geocoding-api.open-meteo.com</code>) - turns the city you typed
          into coordinates, and provides the city suggestions in Settings. What is sent is the text you typed.
        </li>
        <li>
          <strong>OpenStreetMap Nominatim</strong> (<code>nominatim.openstreetmap.org</code>) - only when you use your
          current location: it turns your coordinates into a city name to display. What is sent is those coordinates.
        </li>
        <li>
          <strong>ipapi.co</strong> - only as a last resort, after you have allowed location but the browser could not
          return a position and no position from the last 24 hours was saved. It returns a rough, IP-based position.
        </li>
      </ul>
      <p>
        None of these need an API key or an account. Your last position (used for weather only) and the last weather
        reading are stored on your device. If you type a city yourself, your location is never requested from the
        browser. The <Link to="/privacy">privacy policy</Link> lists every service WindoM contacts.
      </p>

      <h2>Typed city or current location</h2>
      <ul>
        <li>
          <strong>A typed city is fixed.</strong> It does not depend on where you are, works on any network and never
          triggers a browser prompt. It is the better choice if you travel with a VPN or want the same place every day.
        </li>
        <li>
          <strong>Current location follows you.</strong> It uses the browser's position when the permission is already
          granted, falls back to a position saved in the last 24 hours, and only then to the IP-based lookup.
        </li>
      </ul>

      <h2>Tips</h2>
      <ul>
        <li>
          When you type a city, the widget uses the first match for the saved name. If a name is shared by several
          places and the widget shows the wrong one, try a different or more specific spelling.
        </li>
        <li>
          Hide the widget with the Weather toggle, or use the <strong>Minimal</strong>, <strong>Night Owl</strong> or{' '}
          <strong>Deep Focus</strong> preset from <Link to="/guide/templates">Layout Templates</Link>, which turn it
          off.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>The widget shows a pin icon and "Set location".</strong> No city is set and location has not been
          allowed. Click it to open Settings → Weather and pick one of the two options.
        </li>
        <li>
          <strong>"City not found".</strong> The geocoding service had no match for the typed name. Try the English
          spelling, or choose from the suggestions.
        </li>
        <li>
          <strong>A warning icon appears.</strong> The widget could not fetch weather and had no saved reading. It
          retries on the next refresh or the next new tab.
        </li>
        <li>
          <strong>You are offline or Open-Meteo is unreachable.</strong> If a previous reading is saved, the widget
          keeps showing it instead of an error.
        </li>
        <li>
          <strong>"Location access is blocked for WindoM".</strong> Chrome has the permission set to blocked. Allow
          location for the extension in Chrome's site settings and try again, or type a city.
        </li>
        <li>
          <strong>The temperature is in the wrong unit.</strong> Check <strong>Temperature Unit</strong> in Settings →
          Weather.
        </li>
      </ul>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/clock">Clock</Link> - time and date on the new tab
        </li>
        <li>
          <Link to="/guide/templates">Layout Templates</Link> - presets that show or hide the weather
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
