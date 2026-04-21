import { useState, useCallback } from 'react';
import { HelpCircle, X, Image, Music, Calendar, Timer, Link2, Settings } from 'lucide-react';

interface GuideSection {
  icon: React.ReactNode;
  title: string;
  steps: string[];
}

const SECTIONS: GuideSection[] = [
  {
    icon: <Image size={16} />,
    title: 'Change your background',
    steps: [
      'Open Settings (gear icon, bottom-left)',
      'Go to the Background tab',
      'Choose Unsplash for curated photos, or upload your own image',
    ],
  },
  {
    icon: <Timer size={16} />,
    title: 'Use the Focus timer',
    steps: [
      'Click the focus area in the center of your tab',
      'Type what you\'re working on and press Enter',
      'Your timer starts — the tab dims everything else',
    ],
  },
  {
    icon: <Music size={16} />,
    title: 'Connect Spotify',
    steps: [
      'Open Settings → Account tab',
      'Sign in or create a WindoM account',
      'Click "Connect Spotify" and authorize the app',
      'Now-playing appears in the top dock automatically',
    ],
  },
  {
    icon: <Calendar size={16} />,
    title: 'Connect Google Calendar',
    steps: [
      'Open Settings → Account tab',
      'Sign in or create a WindoM account',
      'Click "Connect Google Calendar" and authorize',
      'Your events appear in the right sidebar',
    ],
  },
  {
    icon: <Link2 size={16} />,
    title: 'Add quick links',
    steps: [
      'Open Settings → Links tab',
      'Add or reorder your favourite sites',
      'They appear in the dock bar at the top',
    ],
  },
  {
    icon: <Settings size={16} />,
    title: 'Customize everything',
    steps: [
      'Clock format, size, and color — Clock tab',
      'Weather widget and location — Weather tab',
      'Daily quotes on or off — Quotes tab',
      'General tab for your name and search engine',
    ],
  },
];

export function GuidePanel(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

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
              <span className="guide-panel-title">Help &amp; Guide</span>
              <button className="guide-panel-close" onClick={close} aria-label="Close guide">
                <X size={16} />
              </button>
            </div>

            <div className="guide-panel-body">
              {SECTIONS.map((section) => (
                <div className="guide-section" key={section.title}>
                  <div className="guide-section-title">
                    {section.icon}
                    <span>{section.title}</span>
                  </div>
                  <ol className="guide-section-steps">
                    {section.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
