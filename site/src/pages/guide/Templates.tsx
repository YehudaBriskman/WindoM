import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Layout Templates.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Templates() {
  return (
    <DocsLayout path="/guide/templates" eyebrow="User Guide" title="Layout Templates">
      <h2>Overview</h2>

      <p>
        Settings → <strong>Templates</strong> has six preset layouts that switch several settings at once:{' '}
        <strong>Minimal</strong> (just the clock), <strong>Productivity</strong>, <strong>Inspiration</strong>,{' '}
        <strong>Dashboard</strong> (everything on), <strong>Night Owl</strong> and <strong>Deep Focus</strong>.
      </p>
      <p>
        Click <strong>Apply</strong> on one and confirm. A template only overwrites the sections it covers, and the
        confirmation names them; your links, keys and connections stay as they are.
      </p>
      <h2>What each template sets</h2>
      <p>
        Every template changes the same three groups of settings: the <strong>clock</strong> (style, weight, size, and
        whether the date shows), the <strong>weather</strong> widget (shown or hidden) and the <strong>widgets</strong>{' '}
        (quick links, focus prompt, daily quote). That is why the confirmation lists exactly these names. The preset
        values are:
      </p>
      <ul>
        <li>
          <strong>Minimal</strong> - clock in the default style at size 140, no date. Weather, quick links, focus prompt
          and quotes are all hidden.
        </li>
        <li>
          <strong>Productivity</strong> - default clock at size 120 with the long date. Weather, quick links and focus
          prompt are shown; quotes are hidden.
        </li>
        <li>
          <strong>Inspiration</strong> - glass-style clock at size 110, no date. Weather and daily quotes are shown
          (quotes set to the built-in list); quick links and focus prompt are hidden.
        </li>
        <li>
          <strong>Dashboard</strong> - default clock at size 100 with the long date. Weather, quick links, focus prompt
          and quotes are all shown.
        </li>
        <li>
          <strong>Night Owl</strong> - outline-style clock at size 130 in purple (<code>#a78bfa</code>), no date. Only
          the focus prompt is shown; weather, quick links and quotes are hidden.
        </li>
        <li>
          <strong>Deep Focus</strong> - default clock at size 90, no date. Only the focus prompt is shown; everything
          else in these groups is hidden.
        </li>
      </ul>

      <h2>What a template leaves alone</h2>
      <p>
        A template sets only the values listed above and nothing else inside those groups. In particular it does not
        change your 12h or 24h time format, your quick-link list, your weather unit or city, your background, your
        Finance watchlist, or any connected account. A template that hides the weather widget or quick links only hides
        them; the city and the links are still saved and come back when you show those widgets again. The same applies
        to the clock colour, which only <strong>Night Owl</strong> changes.
      </p>

      <h2>Applying and undoing</h2>
      <ol>
        <li>
          Open Settings → <strong>Templates</strong> and choose a card.
        </li>
        <li>
          Click <strong>Apply</strong>. A confirmation asks whether to apply the template and names the groups it will
          overwrite.
        </li>
        <li>
          Confirm. The change takes effect straight away, and the card briefly shows <strong>Applied!</strong>.
        </li>
      </ol>
      <p>
        There is no undo button and no saved copy of your previous layout. To go back, change the individual settings
        yourself or apply a different template. If you want a layout you can return to, note the values you care about
        (for example clock size and which widgets are on) before applying.
      </p>

      <h2>Customising after you apply</h2>
      <p>
        A template is a starting point, not a locked mode. After applying one, every individual setting stays editable:
        change the clock style or size in the clock settings, switch weather, quick links, the focus prompt or the daily
        quote on or off, and so on. Your edits stay until you apply another template that covers the same values.
      </p>

      <h2>Choosing a template</h2>
      <ul>
        <li>
          Want a calm tab with just the time? <strong>Minimal</strong>.
        </li>
        <li>
          Use the new tab to start work? <strong>Productivity</strong> keeps the date, links and focus prompt in view.
        </li>
        <li>
          Want a little variety each day? <strong>Inspiration</strong> puts the daily quote in front.
        </li>
        <li>
          Want everything at a glance? <strong>Dashboard</strong> turns every one of these widgets on.
        </li>
        <li>
          Working at night or in a dark room? <strong>Night Owl</strong> pairs a purple outline clock with only the
          focus prompt.
        </li>
        <li>
          Need to concentrate on a single task? <strong>Deep Focus</strong> leaves just your intention for the day. See{' '}
          <Link to="/guide/focus">Focus</Link>.
        </li>
      </ul>

      <h2>Common questions</h2>
      <p>
        <strong>Will a template delete my quick links?</strong>
      </p>
      <p>No. It can hide the quick links, but the list itself is not changed.</p>
      <p>
        <strong>Does a template turn on Finance, Calendar, Spotify or GitHub?</strong>
      </p>
      <p>No. Templates do not touch connected apps or the Finance watchlist.</p>
      <p>
        <strong>Does a template sync to my other browsers?</strong>
      </p>
      <p>
        The values it sets are ordinary settings, so they sync like any other change if you are signed in to a WindoM
        account (settings sync is an account feature). See <Link to="/guide/account">Account</Link>.
      </p>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/clock">Clock</Link> - style, size, weight and date format
        </li>
        <li>
          <Link to="/guide/weather">Weather</Link>, <Link to="/guide/links">Quick Links</Link>,{' '}
          <Link to="/guide/quotes">Quotes</Link> and <Link to="/guide/focus">Focus</Link> - the widgets templates switch
        </li>
        <li>
          <Link to="/support">Support</Link>
        </li>
      </ul>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
