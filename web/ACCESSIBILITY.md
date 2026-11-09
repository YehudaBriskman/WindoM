# Accessibility - WindoM extension (web/)

**Target:** WCAG 2.2 level AA, which also covers Israel's IS 5568 (WCAG 2.0 AA plus local rules).
**Status:** a code-level pass, not a conformance claim. It has not been tested with a browser, a screen reader, or by an accredited accessibility expert, so WindoM is not certified as conforming.

## Fixed in this pass

- Settings gear, sidebar toggle and "add link" were clickable `div`s, unreachable by keyboard. They are now buttons with names and `aria-expanded`.
- Closed panels (settings, sidebar, add-link form, search overlay) were invisible but still in the tab order. They are now `inert` while closed.
- Settings and sidebar open as labelled dialogs: focus moves in on open, Escape closes, focus returns to the toggle. Onboarding, the app-centre panel and focus mode are modal dialogs with focus move-in, Tab wrap, Escape and focus restore (`hooks/useModalFocus.ts`).
- Accessible names: todo checkbox and remove button (include the task text), settings, sign-in and account inputs that only had a placeholder or an unassociated label, link editor fields, search box.
- Search overlay uses the combobox/listbox pattern (`aria-activedescendant`, `aria-selected`).
- Focus text could only be edited by double-click; there is now an "Edit main focus" button.
- Tab sidebar was hover-only; focusing a control in it now reveals it.
- Form errors and success messages announce (`role="alert"` / `status`). The ticking clock is deliberately not a live region.
- Landmarks and headings: `main`, an `h1`, sidebar headings start at `h2`, a skip link, settings nav is a `nav` with `aria-current`.
- Visible focus for inputs that removed the outline; hit areas of at least 24px for small controls (remove, dismiss, checkbox, like).
- `prefers-reduced-motion`: looping spinner, equaliser and disc, entrance animations and smooth scrolling are off.
- Basic `forced-colors` rules (borders and focus from system colours).

## Known gaps / unverified

- **Text contrast over photo backgrounds is not verified.** White text relies on a 20% black scrim plus text-shadow; a bright photo may fail 4.5:1. The photo credit was made more opaque, nothing else was measured. Several secondary labels use 30-45% white and probably fail on some backgrounds.
- Onboarding step dots and dock row dots (5-7px) have a larger hit area but may still be under 24px horizontally.
- Forced-colors and high-contrast rendering of the glass effect and custom checkboxes/toggles is untested.
- Focus-ring contrast against every background is untested.
- Nothing was tested with NVDA, JAWS, VoiceOver or TalkBack, including Hebrew. The UI is English only and the document is `lang="en"`; there is no RTL layout.
- Dynamic content (weather, Gmail, GitHub, Spotify, calendar widgets) was not audited individually beyond the checks above.
- No keyboard shortcut customisation; the search shortcut (Ctrl+Meta+H) cannot be turned off (WCAG 2.1.4 applies only to single-key shortcuts, so this is expected to be fine, but unchecked).
- The content-script mode (UI injected into other pages in a shadow root) was not audited.

## Report a barrier

Email **yehudabriskman@windom.app** with the page or feature, what you were using (browser, assistive technology) and what went wrong. Please say how you would like to be answered.
