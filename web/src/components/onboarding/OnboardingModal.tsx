import { useState } from 'react';
import { Image, Timer, Music, Calendar, Sparkles, ArrowRight, X } from 'lucide-react';

interface Props {
  onComplete: () => Promise<void>;
}

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: <Sparkles size={36} />,
    title: 'Welcome to WindoM',
    description: 'Your personal new tab — a calm, focused space for everything you need throughout the day.',
  },
  {
    icon: <Image size={36} />,
    title: 'Set your background',
    description: 'Pick a stunning Unsplash photo or upload your own image. Open Settings → Background to get started.',
  },
  {
    icon: <Timer size={36} />,
    title: 'Stay focused',
    description: 'Use the Focus timer to set an intention and block distractions. Click the focus area in the center of your tab.',
  },
  {
    icon: <Music size={36} />,
    title: 'Connect Spotify',
    description: 'See what\'s playing right in your new tab. Go to Settings → Account to link your Spotify account.',
  },
  {
    icon: <Calendar size={36} />,
    title: 'Connect your calendar',
    description: 'Pull in Google Calendar events so your day is always visible. Settings → Account → Connect Google Calendar.',
  },
];

export function OnboardingModal({ onComplete }: Props): React.ReactElement {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  function next(): void {
    if (isLast) {
      void onComplete();
    } else {
      setStep((s) => s + 1);
    }
  }

  function prev(): void {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="onboarding-backdrop">
      <div className="onboarding-modal" role="dialog" aria-modal="true" aria-label="Welcome to WindoM">
        <button className="onboarding-skip" onClick={() => void onComplete()} aria-label="Skip onboarding">
          <X size={16} />
        </button>

        <div className="onboarding-icon">{current.icon}</div>

        <div className="onboarding-body">
          <h2 className="onboarding-title">{current.title}</h2>
          <p className="onboarding-description">{current.description}</p>
        </div>

        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`onboarding-dot${i === step ? ' active' : ''}`}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        <div className="onboarding-footer">
          {step > 0 && (
            <button className="onboarding-btn-back" onClick={prev}>
              Back
            </button>
          )}
          <button className="onboarding-btn-next" onClick={next}>
            {isLast ? 'Get started' : (
              <>Next <ArrowRight size={14} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
