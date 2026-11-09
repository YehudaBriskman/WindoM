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
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
