import { useState, useCallback } from 'react';
import { HelpCircle, X, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { SETTINGS_EVENT } from '../../lib/settings-events';

const GUIDE_URL = 'https://windom.app/guide.html';

// ── Types ────────────────────────────────────────────────────────────────────

interface GuideBlock {
  type: 'steps' | 'note' | 'tip';
  content: string | string[];
}

interface GuideSection {
  id: string;
  title: string;
  summary: string;
  blocks: GuideBlock[];
}

// ── Condensed fallback content (shown when offline or preferred) ──────────────

const SECTIONS: GuideSection[] = [
  {
    id: 'spotify',
    title: 'Connect Spotify',
    summary: 'Needs a free Spotify Developer app (BYOA) - takes ~2 min.',
    blocks: [
      {
        type: 'note',
        content: 'WindoM uses your own Spotify app so your account stays private. It\'s free and takes about 2 minutes to set up.',
      },
      {
        type: 'steps',
        content: [
          'Go to developer.spotify.com/dashboard and create a free app. Set API to "Web API".',
          'Open WindoM Settings → Spotify tab. Copy the Redirect URI shown there using the Copy button.',
          'Back in the Spotify Dashboard → your app → Settings → Redirect URIs → paste it → Add → Save.',
          'Copy the Client ID from your Spotify app dashboard.',
          'Paste it into WindoM Settings → Spotify tab and click "Save & Connect".',
          'Authorize in the Spotify popup. Done - now-playing appears in your dock.',
        ],
      },
      {
        type: 'tip',
        content: 'Getting "Invalid Client"? The Redirect URI wasn\'t saved in your Spotify app, or the Client ID is wrong. Use the Copy button - don\'t type the URI by hand.',
      },
    ],
  },
  {
    id: 'calendar',
    title: 'Connect Google Calendar',
    summary: 'Shows upcoming events in the right sidebar. Needs a WindoM account.',
    blocks: [
      {
        type: 'steps',
        content: [
          'Sign in or create a WindoM account (Settings → Account tab).',
          'Open Settings → Apps hub → Calendar.',
          'Click "Connect" and authorize in the Google popup - read-only access only.',
          'Your events appear in the right sidebar, grouped by day.',
        ],
      },
      {
        type: 'tip',
        content: 'Change the look-ahead window (7 / 14 / 30 days) in Settings → Apps hub → Calendar.',
      },
    ],
  },
  {
    id: 'gmail',
    title: 'Connect Gmail',
    summary: 'Shows unread count and recent messages in the sidebar. Needs a WindoM account.',
    blocks: [
      {
        type: 'steps',
        content: [
          'Sign in or create a WindoM account (Settings → Account tab).',
          'Open Settings → Apps hub → Gmail.',
          'Click "Connect" and authorize in the Google popup - grants gmail.readonly and calendar.readonly together.',
          'Your unread count badge and up to 5 recent messages appear in the right sidebar.',
        ],
      },
      {
        type: 'note',
        content: 'Gmail access requires the Gmail API to be enabled in your Google Cloud project. If you see an "API access denied" error, go to console.cloud.google.com → APIs & Services → Library → search "Gmail API" → Enable.',
      },
      {
        type: 'tip',
        content: 'Toggle the Gmail widget on or off in Settings → Apps hub → Gmail → "Show Gmail in sidebar".',
      },
    ],
  },
  {
    id: 'finance',
    title: 'Finance Dashboard',
    summary: 'Live stock and crypto prices on your dashboard - no API key needed.',
    blocks: [
      {
        type: 'steps',
        content: [
          'Open Settings → Apps hub → Finance.',
          'Search and add stock tickers (e.g. AAPL, TSLA, SPY) using the search bar.',
          'Add crypto coins from the grid (Bitcoin, Ethereum, Solana, and more).',
          'Two scrollable cards appear on your dashboard - one for stocks, one for crypto.',
        ],
      },
      {
        type: 'tip',
        content: 'Use the show/hide toggle at the top of each card to collapse stocks or crypto independently.',
      },
    ],
  },
  {
    id: 'focus',
    title: 'Focus Timer',
    summary: 'Set an intention - the tab dims while you work.',
    blocks: [
      {
        type: 'steps',
        content: [
          'Click the focus input in the center of your tab.',
          'Type what you\'re working on and press Enter.',
          'Click anywhere or press Escape to exit focus mode.',
        ],
      },
      {
        type: 'tip',
        content: 'Save common tasks as presets in Settings → Focus.',
      },
    ],
  },
  {
    id: 'background',
    title: 'Change Your Background',
    summary: 'Rotating Unsplash photos or upload your own image.',
    blocks: [
      {
        type: 'steps',
        content: [
          'Open Settings → Background tab.',
          'Choose Unsplash for curated rotating photos, or Local to upload your own.',
          'For Unsplash: paste a Collection ID from the URL of any unsplash.com/collections page to curate the style.',
        ],
      },
    ],
  },
  {
    id: 'weather',
    title: 'Weather Widget',
    summary: 'Live temperature in the top bar. Needs a free OpenWeatherMap key.',
    blocks: [
      {
        type: 'steps',
        content: [
          'Create a free account at openweathermap.org and copy your API key.',
          'Open Settings → Weather tab. Paste the key and set your city name.',
          'Choose °C or °F and save.',
        ],
      },
      {
        type: 'note',
        content: 'New OpenWeatherMap keys can take up to 2 hours to activate.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Create a WindoM Account',
    summary: 'Optional - only needed for Spotify and Google Calendar.',
    blocks: [
      {
        type: 'steps',
        content: [
          'Open Settings → Account tab.',
          'Enter your email and a password (min 8 characters), then click "Create account".',
          'Verify your email via the link sent to your inbox.',
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
        {block.content.map((step, i) => <li key={i}>{step}</li>)}
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
  return (
    <div className="guide-block-tip" key={idx}>
      <span className="guide-block-label">Tip</span>
      <p>{block.content as string}</p>
    </div>
  );
}

function GuideSectionItem({ section, defaultOpen = false }: { section: GuideSection; defaultOpen?: boolean }): React.ReactElement {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`guide-section${open ? ' open' : ''}`}>
      <button className="guide-section-header" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
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

  function openFullGuide(): void {
    window.open(GUIDE_URL, '_blank', 'noopener,noreferrer');
  }

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
                  <button className="guide-inline-link" onClick={openSettings}>gear icon</button>
                  , bottom-left.
                </div>
              </div>
              <button className="guide-panel-close" onClick={close} aria-label="Close guide">
                <X size={16} />
              </button>
            </div>

            {/* Primary CTA - full guide on website */}
            <button className="guide-full-link" onClick={openFullGuide}>
              <div className="guide-full-link-text">
                <span className="guide-full-link-title">Full guide with photos</span>
                <span className="guide-full-link-sub">windom.app/guide - opens in a new tab</span>
              </div>
              <ExternalLink size={15} className="guide-full-link-icon" />
            </button>

            {/* Fallback - condensed in-app reference */}
            <div className="guide-fallback-label">Quick reference</div>

            <div className="guide-panel-body">
              {SECTIONS.map((section, i) => (
                <GuideSectionItem key={section.id} section={section} defaultOpen={i === 0} />
              ))}
            </div>

          </div>
        </>
      )}
    </>
  );
}
