import { useState, useCallback } from 'react';
import { HelpCircle, X, ChevronDown, ChevronRight } from 'lucide-react';
import { SETTINGS_EVENT } from '../../lib/settings-events';

// ── Types ────────────────────────────────────────────────────────────────────

interface GuideBlock {
  type: 'steps' | 'note' | 'tip' | 'code';
  content: string | string[];
}

interface GuideSection {
  id: string;
  title: string;
  summary: string;
  blocks: GuideBlock[];
}

// ── Guide content ─────────────────────────────────────────────────────────────

const SECTIONS: GuideSection[] = [
  {
    id: 'spotify',
    title: 'Connect Spotify',
    summary: 'See what\'s playing right in your new tab — requires a free Spotify Developer app.',
    blocks: [
      {
        type: 'note',
        content:
          'WindoM uses your own Spotify Developer app (BYOA — Bring Your Own App). This is free and takes about 2 minutes. It keeps your account private and avoids any shared rate limits.',
      },
      {
        type: 'steps',
        content: [
          'Go to developer.spotify.com/dashboard and log in with your Spotify account.',
          'Click "Create app". Give it any name and description (e.g. "My WindoM").',
          'Set the Redirect URI field — you\'ll copy the correct value from WindoM in the next step.',
          'Set "Which API/SDKs are you planning to use?" to "Web API". Agree to the terms and click Save.',
          'Open WindoM Settings (gear icon, bottom-left) → Spotify tab.',
          'You\'ll see your Redirect URI displayed there — copy it using the Copy button.',
          'Go back to your Spotify app → Edit Settings → Redirect URIs → paste it → click Add → Save.',
          'Back in the Spotify Dashboard, click on your app name and copy the Client ID.',
          'Paste the Client ID into the WindoM Spotify tab and click "Save & Connect".',
          'A Spotify authorization window will open — click Agree. You\'re connected.',
        ],
      },
      {
        type: 'tip',
        content:
          'The Redirect URI is unique to your Chrome installation. If you reinstall Chrome or use a different profile, you\'ll need to add the new URI in your Spotify app settings.',
      },
    ],
  },
  {
    id: 'calendar',
    title: 'Connect Google Calendar',
    summary: 'Pull your upcoming events into the right sidebar. Requires a WindoM account.',
    blocks: [
      {
        type: 'steps',
        content: [
          'Open Settings (gear icon, bottom-left) → Account tab.',
          'Register or sign in to your WindoM account. You only need an email and password.',
          'Once signed in, you\'ll see a "Connected Services" section with a Google Calendar card.',
          'Click "Connect" on the Google Calendar card.',
          'A Google authorization window opens — choose your Google account and click Allow.',
          'Your upcoming events will now appear in the right sidebar automatically.',
        ],
      },
      {
        type: 'tip',
        content:
          'Events are pulled for the next 7 days by default. You can change the look-ahead window (7, 14, or 30 days) in Settings → Calendar.',
      },
    ],
  },
  {
    id: 'focus',
    title: 'Use the Focus Timer',
    summary: 'Set an intention for your session — the tab dims everything else while you work.',
    blocks: [
      {
        type: 'steps',
        content: [
          'Click the focus area in the center of your tab (or the text that says "What\'s your focus today?").',
          'Type what you\'re working on and press Enter.',
          'The timer starts and the background dims — only your focus text stays visible.',
          'Click the timer or press Escape to exit focus mode.',
        ],
      },
      {
        type: 'tip',
        content:
          'You can set preset focus goals in Settings → Focus to quickly pick from your most common tasks.',
      },
    ],
  },
  {
    id: 'background',
    title: 'Change Your Background',
    summary: 'Choose a curated Unsplash photo collection or upload your own image.',
    blocks: [
      {
        type: 'steps',
        content: [
          'Open Settings (gear icon, bottom-left) → Background tab.',
          'Choose "Unsplash" for automatic rotating photos. You can paste a Collection ID to curate the style.',
          'Or choose "Local" and upload any image from your device. It\'s stored privately on your device only.',
          'The background updates on every new tab by default.',
        ],
      },
      {
        type: 'note',
        content:
          'To use Unsplash with a custom collection, find a collection on unsplash.com, copy its ID from the URL, and paste it into the Collection ID field.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Create a WindoM Account',
    summary: 'Optional — needed only for Google Calendar sync and Spotify. Everything else works without one.',
    blocks: [
      {
        type: 'note',
        content:
          'Your account stores your settings in the cloud so they sync across devices. Clock, weather, background, todos, and quick links all work without an account.',
      },
      {
        type: 'steps',
        content: [
          'Open Settings → Account tab.',
          'Enter your email and a password (minimum 8 characters) and click "Create account".',
          'Check your inbox for a verification email and click the link.',
          'You\'re signed in — your settings now sync to the cloud.',
        ],
      },
      {
        type: 'tip',
        content:
          'You can also sign in with Google if you prefer not to manage a password.',
      },
    ],
  },
  {
    id: 'weather',
    title: 'Set Up the Weather Widget',
    summary: 'Show live temperature and conditions in the top bar. Requires a free OpenWeatherMap key.',
    blocks: [
      {
        type: 'steps',
        content: [
          'Go to openweathermap.org, create a free account, and copy your API key.',
          'Open Settings → Weather tab.',
          'Paste your API key and set your city name (e.g. "Tel Aviv" or "New York").',
          'Choose °C or °F and click Save. The widget appears in the top bar.',
        ],
      },
      {
        type: 'note',
        content:
          'Free OpenWeatherMap accounts have a generous limit (1,000 calls/day) — more than enough for personal use.',
      },
    ],
  },
  {
    id: 'links',
    title: 'Quick Links & Dock Bar',
    summary: 'Pin your most-used sites to the dock at the top of every tab.',
    blocks: [
      {
        type: 'steps',
        content: [
          'Open Settings → Links tab.',
          'Click "Add link", enter the URL and a display name.',
          'Drag to reorder. Click the × to remove a link.',
          'Links appear as icons in the dock bar across the top of your tab.',
        ],
      },
    ],
  },
  {
    id: 'clock',
    title: 'Customize the Clock',
    summary: 'Change the time format, size, color, and whether the date is shown.',
    blocks: [
      {
        type: 'steps',
        content: [
          'Open Settings → Clock tab.',
          'Toggle between 12-hour and 24-hour format.',
          'Adjust the font size and pick a color using the color picker.',
          'Enable or disable the date display and choose your preferred date format.',
        ],
      },
    ],
  },
];

// ── Renderers ─────────────────────────────────────────────────────────────────

function renderBlock(block: GuideBlock, idx: number): React.ReactElement {
  if (block.type === 'steps' && Array.isArray(block.content)) {
    return (
      <ol className="guide-block-steps" key={idx}>
        {block.content.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    );
  }

  if (block.type === 'note') {
    return (
      <div className="guide-block-note" key={idx}>
        <span className="guide-block-label">Note</span>
        <p>{block.content as string}</p>
      </div>
    );
  }

  if (block.type === 'tip') {
    return (
      <div className="guide-block-tip" key={idx}>
        <span className="guide-block-label">Tip</span>
        <p>{block.content as string}</p>
      </div>
    );
  }

  return (
    <pre className="guide-block-code" key={idx}>
      <code>{block.content as string}</code>
    </pre>
  );
}

// ── Collapsible section ───────────────────────────────────────────────────────

function GuideSectionItem({ section, defaultOpen = false }: { section: GuideSection; defaultOpen?: boolean }): React.ReactElement {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`guide-section${open ? ' open' : ''}`}>
      <button
        className="guide-section-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="guide-section-meta">
          <span className="guide-section-title">{section.title}</span>
          <span className="guide-section-summary">{section.summary}</span>
        </div>
        <span className="guide-section-chevron">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {open && (
        <div className="guide-section-body">
          {section.blocks.map((block, i) => renderBlock(block, i))}
        </div>
      )}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export function GuidePanel(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  function openSettings(): void {
    document.dispatchEvent(new CustomEvent(SETTINGS_EVENT.TOGGLE));
    close();
  }

  return (
    <>
      <button className="guide-btn" onClick={open} aria-label="Help & Guide">
        <HelpCircle size={18} />
      </button>

      {isOpen && (
        <>
          <div className="guide-backdrop" onClick={close} />
          <div className="guide-panel" role="dialog" aria-modal="true" aria-label="WindoM Guide">
            <div className="guide-panel-header">
              <div>
                <div className="guide-panel-title">Help &amp; Guide</div>
                <div className="guide-panel-subtitle">
                  Settings are in the{' '}
                  <button className="guide-inline-link" onClick={openSettings}>
                    gear icon
                  </button>
                  , bottom-left.
                </div>
              </div>
              <button className="guide-panel-close" onClick={close} aria-label="Close guide">
                <X size={16} />
              </button>
            </div>

            <div className="guide-panel-body">
              {SECTIONS.map((section, i) => (
                <GuideSectionItem
                  key={section.id}
                  section={section}
                  defaultOpen={i === 0}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
