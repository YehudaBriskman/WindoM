import { Link } from 'react-router';
import { DocsLayout } from '../components/DocsLayout';
import { AUTHOR, BLOG_URL, CONTACT_EMAIL, GITHUB_URL, PROJECT_PAGE, STORE_URL } from '../lib/site';

/**
 * Who makes WindoM, said once and in plain words.
 *
 * Every statement here is already on the record somewhere else: the footer
 * credits the author, the README says what the product is and that it is MIT
 * licensed, the privacy policy says there is no analytics. This page gathers
 * them under the author's name so a person, or a search engine, who arrives
 * asking "who is behind this" finds the answer and the profiles that confirm it.
 * It names no employer and gives no user numbers, because neither is the
 * extension's to state.
 */
export function About() {
  return (
    <DocsLayout
      path="/about"
      eyebrow="About"
      title="About WindoM and its author"
      subtitle="Made by one person, open source, and described in the open"
    >
      <h2>Who makes WindoM</h2>
      <p>
        WindoM is made by{' '}
        <a href={AUTHOR.url} rel="author">
          {AUTHOR.name}
        </a>{' '}
        ({AUTHOR.nameHe}), a full-stack engineer and technical team lead in Tel Aviv. He designs, builds and maintains
        the extension, its optional backend and this website himself. You can find him as {AUTHOR.name} on{' '}
        <a href={GITHUB_URL.replace('/WindoM', '')}>GitHub</a>, and his own site is{' '}
        <a href={AUTHOR.url}>yehudabriskman.com</a>.
      </p>

      <h2>What WindoM is</h2>
      <p>
        WindoM is a Chrome extension that replaces the new tab page with a clock and greeting, the weather, a todo list,
        quick links, a focus timer, a daily quote, search across your tabs and history, and live stock and crypto
        prices, on a background that changes with the hour. Google Calendar, GitHub and Spotify can be connected with a
        free WindoM account. Most of it works the moment it is installed, with no account at all. The{' '}
        <Link to="/guide">User Guide</Link> covers every panel, one page each.
      </p>

      <h2>Open source and free</h2>
      <p>
        The whole project is published under the MIT licence at{' '}
        <a href={GITHUB_URL}>github.com/YehudaBriskman/WindoM</a>: the extension, the backend and this site. It is free
        to install from the <a href={STORE_URL}>Chrome Web Store</a>, and you can run the entire stack yourself by
        following <Link to="/local-setup">Local Setup</Link>.
      </p>

      <h2>Privacy</h2>
      <p>
        There is no analytics, no telemetry and no advertising. What is stored on your device, and what the optional
        account syncs, is spelled out on the <Link to="/privacy">Privacy Policy</Link> page.
      </p>

      <h2>Where to read more</h2>
      <ul>
        <li>
          <a href={PROJECT_PAGE}>WindoM on yehudabriskman.com</a> - the project page, and the author's description of
          what it is
        </li>
        <li>
          <a href={BLOG_URL}>Notes and release posts</a> - what each release changed, and why
        </li>
        <li>
          <Link to="/support">Support</Link> and <Link to="/contact">Contact</Link> - fixes for the common problems, and
          how to reach the author at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </li>
      </ul>
    </DocsLayout>
  );
}
