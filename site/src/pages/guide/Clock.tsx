import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Clock, Date & Greeting.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Clock() {
  return (
    <DocsLayout path="/guide/clock" eyebrow="User Guide" title="Clock, Date & Greeting">
      <h2>Overview</h2>

      <p>
        The clock is the centerpiece of your new tab. All of its options are in Settings → <strong>Clock</strong>:
      </p>
      <ul>
        <li>
          <strong>Time Format</strong> - 12-hour or 24-hour, with optional seconds and a leading zero
        </li>
        <li>
          <strong>Style</strong> - default, glass or outline digits
        </li>
        <li>
          <strong>Color</strong> - pick any color with the color picker
        </li>
        <li>
          <strong>Size</strong> - a slider from 60 to 180 pixels
        </li>
        <li>
          <strong>Font Weight</strong> - Thin, Light, Regular or Bold
        </li>
        <li>
          <strong>Show Date</strong> - the date below the time, in a long, short or numeric format
        </li>
      </ul>
      <p>
        Under the clock is a greeting that follows the time of day - good morning, afternoon, evening or night - and
        your name. Click the name to change it, press <strong>Enter</strong> to keep the change or{' '}
        <strong>Escape</strong> to cancel it. It starts as <em>Friend</em>; if you sign in to an account with a name
        while it still says that, your first name replaces it. To hide the greeting, turn off <strong>Greeting</strong>{' '}
        under Settings → General → <strong>Widget Visibility</strong>.
      </p>
      <h2>How it works</h2>
      <p>
        The clock reads your device's own time and redraws on a timer, so it needs no network and no account. The
        greeting is chosen from the hour on your device: <strong>Good morning</strong> from 5:00 to 11:59,{' '}
        <strong>Good afternoon</strong> from 12:00 to 16:59, <strong>Good evening</strong> from 17:00 to 20:59, and{' '}
        <strong>Good night</strong> from 21:00 until 4:59. The date uses your browser's language and regional format, so
        the order of day and month follows your locale.
      </p>

      <h2>Every setting explained</h2>
      <p>
        The Clock tab is split into three groups: Format, Appearance and Date. Defaults are what you get on a fresh
        install or after resetting settings.
      </p>
      <h3>Format</h3>
      <ul>
        <li>
          <strong>Time Format</strong> - 12-hour (default) or 24-hour. In 12-hour mode an AM or PM marker appears next
          to the time. In 24-hour mode hours are always shown with two digits, such as <code>07:30</code>.
        </li>
        <li>
          <strong>Show Seconds</strong> - off by default. Adds <code>:SS</code> to the time.
        </li>
        <li>
          <strong>Leading Zero (09:05)</strong> - off by default. Shows <code>09:05</code> instead of <code>9:05</code>.
          This option appears only in 12-hour mode, because 24-hour time already pads the hour.
        </li>
      </ul>
      <h3>Appearance</h3>
      <ul>
        <li>
          <strong>Style</strong> - <em>default</em> draws solid digits with a soft shadow, <em>glass</em> draws a
          translucent liquid-glass effect tinted with your color, and <em>outline</em> draws only the outline of each
          digit in your color.
        </li>
        <li>
          <strong>Color</strong> - white (<code>#ffffff</code>) by default. It sets the digit color, the glass tint or
          the outline color, depending on the style.
        </li>
        <li>
          <strong>Size</strong> - 120 pixels by default, adjustable from 60 to 180 in steps of 4.
        </li>
        <li>
          <strong>Font Weight</strong> - Thin, Light (default), Regular or Bold.
        </li>
      </ul>
      <h3>Date</h3>
      <ul>
        <li>
          <strong>Show Date</strong> - off by default. When on, the date appears under the time.
        </li>
        <li>
          <strong>Date Format</strong> - Long (such as <em>Monday, March 17</em>, the default), Short (
          <em>Mon, Mar 17</em>) or Numeric (<em>03/17/2026</em>). The exact wording follows your browser's locale.
        </li>
      </ul>
      <p>
        Your name for the greeting is stored under Settings → General → <strong>Your Name</strong>, and you can also
        edit it directly on the new tab as described above.
      </p>

      <h2>Where your data is stored</h2>
      <p>
        Clock settings are saved in Chrome's extension storage in your browser. Nothing about the clock is sent anywhere
        unless you have a WindoM account with settings sync, in which case your settings, including the clock section,
        follow you to other browsers you sign in to. Without an account they stay in your browser. See the{' '}
        <Link to="/privacy">privacy policy</Link> for the full list of what the extension contacts.
      </p>

      <h2>Tips and good setups</h2>
      <ul>
        <li>
          For a bright photo, try a darker <strong>Color</strong> or a heavier <strong>Font Weight</strong> so the
          digits stay readable. For a dark photo, the default white works well.
        </li>
        <li>
          Try the <strong>outline</strong> style with a thin weight and a single accent color; the Night Owl template
          does exactly that, and the Inspiration template pairs the <strong>glass</strong> style with a thin weight.
        </li>
        <li>
          Pick 24-hour time with <strong>Show Seconds</strong> off for the quietest display.
        </li>
        <li>
          If you want only the clock on screen, hide the other widgets under Settings → General → Widget Visibility, or
          apply a ready-made arrangement from <Link to="/guide/templates">Layout templates</Link>. Templates can set the
          clock's style, weight, size and date options.
        </li>
      </ul>

      <h2>Common questions</h2>
      <h3>Why does the greeting say Friend?</h3>
      <p>
        <em>Friend</em> is the default name. Click it and type your own, or sign in to an account that has a name while
        it still says Friend and your first name replaces it.
      </p>
      <h3>Does the clock use my computer's time zone?</h3>
      <p>Yes. It shows your device's local time, so it follows any change you make in your operating system.</p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>The digits are hard to see.</strong> Change <strong>Color</strong>, raise the{' '}
          <strong>Font Weight</strong>, or switch <strong>Style</strong> back to default, which adds a shadow behind the
          digits.
        </li>
        <li>
          <strong>Leading Zero is missing.</strong> It is shown only when Time Format is 12-hour.
        </li>
        <li>
          <strong>The greeting is gone.</strong> Check that <strong>Greeting</strong> is on under Settings → General →
          Widget Visibility.
        </li>
        <li>
          <strong>Nothing helps.</strong> See <Link to="/support">Support</Link>.
        </li>
      </ul>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/templates">Layout templates</Link> - preset arrangements that include clock styles
        </li>
        <li>
          <Link to="/guide/background">Change your background</Link> - choose the photo behind the clock
        </li>
        <li>
          <Link to="/guide/focus">Focus timer</Link> - set an intention and dim the tab
        </li>
      </ul>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
