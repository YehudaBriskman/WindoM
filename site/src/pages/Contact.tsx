import { DocsLayout } from '../components/DocsLayout';
import { GITHUB_URL, CONTACT_EMAIL, SITE } from '../lib/site';

/**
 * How to reach a person, and what to expect when you do.
 *
 * Deliberately not a form. A form needs a backend endpoint, a spam story and
 * somewhere for the messages to land, and all three already exist as email -
 * which also gives the sender a copy of what they sent, which a form does not.
 */
export function Contact() {
  return (
    <DocsLayout path="/contact" eyebrow="Help" title="Contact" subtitle="One person, usually within a few days">
      <p>
        {SITE.name} is built and maintained by Yehuda Briskman. There is no support team behind
        it, which is worth knowing before you write: replies usually take a few days, and
        occasionally longer.
      </p>

      <h2>Reporting a bug or asking for a feature</h2>
      <p>
        <a href={`${GITHUB_URL}/issues`}>GitHub issues</a> is the right place, and the fastest.
        Issues are public, searchable, and someone may have hit the same thing already - the{' '}
        <a href="/support.html">support page</a> covers the problems that come up most.
      </p>
      <p>
        Before opening one, please check the version you are on at{' '}
        <code>chrome://extensions</code>. A good number of reports turn out to be bugs already
        fixed in a later release.
      </p>

      <h2>Email</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> reaches me directly. Use it for
        anything that does not belong in public: a privacy question about your own data, a
        security report, or something commercial.
      </p>

      <h2>Security</h2>
      <p>
        If you have found a vulnerability, please email rather than opening an issue, so it can
        be fixed before it is described publicly. Include enough detail to reproduce it. I will
        confirm receipt, and tell you when a fix has shipped.
      </p>

      <h2>Your data</h2>
      <p>
        For access to or deletion of data held by the optional account, email the address above
        from the address the account uses - that is how the request gets verified. What is held,
        and what never leaves your device, is set out in the{' '}
        <a href="/privacy.html">privacy policy</a>; most of what WindoM stores never reaches a
        server at all, so there is often less to export than people expect.
      </p>

      <h2>The code</h2>
      <p>
        WindoM is open source under the MIT licence at{' '}
        <a href={GITHUB_URL}>github.com/YehudaBriskman/WindoM</a>. Pull requests are welcome, and{' '}
        <a href="/local-setup.html">Local Setup</a> covers running the whole stack - extension,
        backend and database - on your own machine.
      </p>
    </DocsLayout>
  );
}
