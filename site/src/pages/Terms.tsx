import { DocsLayout } from '../components/DocsLayout';

/**
 * Terms governing the hosted service and the published extension.
 *
 * Content is ported verbatim from the previous hand-written page. The wording is
 * legally meaningful and was not edited during the rebuild - the only change is
 * the hostname correction, which named a server that does not exist.
 */
export function Terms() {
  return (
    <DocsLayout path="/terms" eyebrow="Legal" title="Terms of Use" subtitle="Last updated: April 27, 2026">
        <div className="callout">
            <strong>Plain-English summary:</strong> WindoM is a free, open-source new tab extension. Use it for lawful personal productivity purposes, don't abuse it or try to break things, and understand that it comes without warranty. The full legal terms follow below.
          </div>
          <h2>1. Acceptance of terms</h2>
          <p>
            By installing or using the WindoM Chrome extension ("WindoM", "the extension", "the service"), you agree to be bound by these Terms of Use ("Terms").
            If you do not agree, do not install or use WindoM.
          </p>
          <p>
            These Terms apply to all users of the extension, including users who create an account and those who use the extension without one.
          </p>
          <h2>2. What WindoM provides</h2>
          <p>
            WindoM replaces the Chrome new tab page with a customizable productivity dashboard. It provides:
          </p>
          <ul>
            <li>A clock, weather display, and daily quote</li>
            <li>To-do list and quick-link dock</li>
            <li>Customizable background images (Unsplash or your own uploads)</li>
            <li>Focus timer with animated overlay</li>
            <li>Tab history sidebar and search</li>
            <li>Optional account features: settings sync across devices, Google Calendar integration, and Spotify now-playing display</li>
            <li>Finance widget with stock and cryptocurrency price tracking</li>
            <li>GitHub widget showing unread notifications, review requests and assigned issues</li>
          </ul>
          <p>
            Features are provided as-is and may change, be removed, or be replaced at any time. We will do our best to communicate significant changes.
          </p>
          <h2>3. Account registration</h2>
          <p>
            Creating an account is optional. If you choose to register:
          </p>
          <ul>
            <li>You must provide a valid email address and a password you control</li>
            <li>You are responsible for maintaining the security of your password and for all activity that occurs under your account</li>
            <li>You must not share your account credentials with others</li>
            <li>You must notify us immediately at <a href="mailto:yehudabriskman@windom.app">yehudabriskman@windom.app</a> if you suspect unauthorized access</li>
            <li>You must be at least 13 years old to create an account</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms.
          </p>
          <h2>4. Third-party integrations</h2>
          <p>
            WindoM can optionally connect to third-party services. By enabling an integration you agree to that service's own terms and privacy policy in addition to these Terms:
          </p>
          <ul>
            <li><strong>Google:</strong> Connecting your Google account is governed by <a href="https://policies.google.com/terms" target="_blank" rel="noopener">Google's Terms of Service</a> and <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Privacy Policy</a>. WindoM requests read-only access to your Calendar events, and nothing else. You can revoke access at any time via your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener">Google account permissions</a> or from WindoM's settings.</li>
            <li><strong>Spotify:</strong> The Spotify integration uses a Bring Your Own App (BYOA) model - you register a free Spotify Developer app and provide its Client ID. Use of Spotify's API is governed by <a href="https://www.spotify.com/legal/end-user-agreement/" target="_blank" rel="noopener">Spotify's Terms of Service</a> and <a href="https://developer.spotify.com/terms" target="_blank" rel="noopener">Spotify Developer Terms</a>.</li>
            <li><strong>GitHub:</strong> The GitHub widget uses a classic personal access token that you create yourself, with the <code>notifications</code> and <code>repo</code> scopes. Use of GitHub's API is governed by <a href="https://docs.github.com/site-policy/github-terms/github-terms-of-service" target="_blank" rel="noopener">GitHub's Terms of Service</a>. You are responsible for the token you issue and can revoke it at any time from your <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">GitHub token settings</a>.</li>
            <li><strong>Unsplash:</strong> Background images are served under the <a href="https://unsplash.com/license" target="_blank" rel="noopener">Unsplash License</a>.</li>
            <li><strong>Yahoo Finance / CoinGecko:</strong> Financial data is provided for informational purposes only. It is not financial advice. These services are subject to their own terms and availability.</li>
          </ul>
          <p>
            WindoM is not responsible for the availability, accuracy, or terms of any third-party service.
          </p>
          <h2>5. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use WindoM for any unlawful purpose or in violation of any applicable laws or regulations</li>
            <li>Attempt to reverse-engineer, decompile, or tamper with the extension in ways that violate the MIT License terms</li>
            <li>Attempt to gain unauthorized access to our servers, databases, or other users' accounts</li>
            <li>Submit content (background images, todo text, links) that is unlawful, harmful, threatening, abusive, or infringes on intellectual property rights</li>
            <li>Abuse the WindoM backend API - including making automated requests at rates that would degrade service for other users</li>
            <li>Use WindoM to circumvent, exploit, or probe the security of connected third-party services (Google, Spotify, GitHub) beyond normal usage</li>
          </ul>
          <h2>6. User content</h2>
          <p>
            You may upload background images and enter text content (todos, link names, display name) into WindoM.
            You retain full ownership of any content you provide. By uploading or entering content, you confirm that:
          </p>
          <ul>
            <li>You have the right to use and store that content</li>
            <li>The content does not violate any applicable law or third-party rights</li>
          </ul>
          <p>
            Background images you upload are stored exclusively in your own browser's local storage (<code>chrome.storage.local</code>) and are never transmitted to our servers.
          </p>
          <h2>7. Open-source license</h2>
          <p>
            WindoM is open-source software released under the <strong>MIT License</strong>.
            The source code is available at <a href="https://github.com/YehudaBriskman/WindoM" target="_blank" rel="noopener">github.com/YehudaBriskman/WindoM</a>.
            The MIT License grants you broad rights to use, copy, modify, and distribute the software, subject to the conditions stated in the license.
          </p>
          <p>
            These Terms of Use govern your use of the hosted service (the WindoM backend API at <code>windom-api.fly.dev</code> and the published Chrome extension). The MIT License governs use of the source code.
          </p>
          <h2>8. Service availability</h2>
          <p>
            WindoM is provided free of charge. We make no guarantee of uptime, availability, or data persistence for the optional backend features (account sync, Google/Spotify integrations).
            The extension's core features (clock, weather, todos, background images) function entirely locally and are not affected by backend availability.
          </p>
          <p>
            We reserve the right to modify, suspend, or shut down the backend service at any time, with reasonable notice where possible.
          </p>
          <h2>9. Disclaimer of warranties</h2>
          <p>
            WindoM is provided <strong>"as is"</strong> and <strong>"as available"</strong> without warranty of any kind, express or implied. To the fullest extent permitted by applicable law, we disclaim all warranties including, but not limited to:
          </p>
          <ul>
            <li>Fitness for a particular purpose</li>
            <li>Merchantability</li>
            <li>Non-infringement</li>
            <li>Accuracy or completeness of any data (including financial data, weather data, or calendar data)</li>
            <li>Uninterrupted or error-free operation</li>
          </ul>
          <p>
            Financial data displayed in the Finance widget (stock prices, cryptocurrency prices) is for informational purposes only and should not be relied upon for investment decisions.
          </p>
          <h2>10. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Yehuda Briskman and the WindoM project shall not be liable for any indirect, incidental, special, consequential, or punitive damages - including loss of data, loss of profits, or loss of business - arising from your use of or inability to use WindoM, even if advised of the possibility of such damages.
          </p>
          <p>
            Our total liability for any claim arising out of or relating to these Terms or WindoM shall not exceed the amount you have paid us in the twelve months preceding the claim. Since WindoM is free, this means our total liability is zero.
          </p>
          <h2>11. Privacy</h2>
          <p>
            Your use of WindoM is also governed by our <a href="privacy.html">Privacy Policy</a>, which explains what data we collect, how we use it, and your rights regarding that data.
            By using WindoM, you agree to the Privacy Policy.
          </p>
          <h2>12. Termination</h2>
          <p>
            You may stop using WindoM at any time by uninstalling the extension. If you have an account, you can permanently delete it and all associated data from <strong>Settings → Account → Delete account</strong>.
          </p>
          <p>
            We may suspend or terminate your access to the backend service if you violate these Terms, without prior notice in cases of serious violations.
            Termination does not affect any locally stored data - that remains in your browser until you uninstall the extension or clear your browser data.
          </p>
          <h2>13. Changes to these terms</h2>
          <p>
            We may update these Terms from time to time. When we do, we will update the "Last updated" date at the top of this page. For material changes, we will make reasonable efforts to notify users (for example, via a notice in the extension).
            Continued use of WindoM after changes take effect constitutes acceptance of the updated Terms.
          </p>
          <h2>14. Governing law</h2>
          <p>
            These Terms are governed by the laws of the State of Israel, without regard to its conflict-of-law provisions.
            Any disputes arising from these Terms or your use of WindoM shall be subject to the exclusive jurisdiction of the competent courts of Israel.
          </p>
          <h2>15. Contact</h2>
          <p>
            If you have questions about these Terms, please contact us at
            <a href="mailto:yehudabriskman@windom.app">yehudabriskman@windom.app</a>.
          </p>
    </DocsLayout>
  );
}
