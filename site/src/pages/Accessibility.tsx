import { DocsLayout } from '../components/DocsLayout';
import { Link } from 'react-router';
import { CONTACT_EMAIL, SITE } from '../lib/site';

/**
 * Accessibility statement, in the shape Israeli Regulation 35 expects: the
 * standard aimed at, the state of conformance, known limitations, a contact
 * and a date.
 *
 * Deliberately says no more than is true today. The accessibility audit is
 * running separately; update the conformance paragraph and the date only after
 * it has finished, never before. Hebrew twin: pages/he/Accessibility.tsx.
 */
export function Accessibility() {
  return (
    <DocsLayout
      path="/accessibility"
      eyebrow="Legal"
      title="Accessibility Statement"
      subtitle="Last updated: November 9, 2026"
    >
      <p>
        {SITE.name} is a free, open-source Chrome extension and this website describes it. It is made by one individual,
        Yehuda Briskman, who wants it to be usable by as many people as possible, including people with disabilities.
      </p>
      <h2>Where we stand</h2>
      <p>
        Accessibility work on the {SITE.name} extension and on this site is ongoing. The standard we are working toward
        is the Israeli Standard IS 5568, which is based on the Web Content Accessibility Guidelines (WCAG) 2.0 at level
        AA, as Israeli accessibility regulations require. An audit against it is in progress.{' '}
        <strong>Conformance has not yet been fully verified</strong>, so we do not claim that the extension or the site
        conforms to the standard.
      </p>
      <h2>Known limitations</h2>
      <p>
        Because the audit is not finished, we cannot yet give a verified list of limitations. This statement will be
        updated with the results, and its date changed, when the audit is complete.
      </p>
      <h2>Reporting an accessibility problem</h2>
      <p>
        If something in {SITE.name} or on this site is hard or impossible for you to use, please tell us. Email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the subject &ldquo;Accessibility&rdquo;, saying
        what you were trying to do, the page or feature, and the browser and assistive technology you use, if any. You
        can also use any of the other routes on the <Link to="/contact">contact page</Link>. Replies usually take a few
        days. We will look for a workable alternative while the problem is being fixed.
      </p>
      <p>
        This statement was last updated on November 9, 2026. The English version governs; a Hebrew version is at{' '}
        <Link to="/he/accessibility">/he/accessibility</Link>.
      </p>
    </DocsLayout>
  );
}
