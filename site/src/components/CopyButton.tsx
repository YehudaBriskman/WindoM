import { useEffect, useRef, useState } from 'react';

interface CopyButtonProps {
  /** The text that lands on the clipboard. */
  text: string;
  label: string;
  done: string;
}

/**
 * A copy control for a block of code.
 *
 * The confirmation is announced (a polite live region) and shown for two
 * seconds, then the button goes back to its resting label. When the clipboard
 * is unavailable - an insecure origin, a refused permission - nothing changes
 * and the text stays selectable, which is what the block offered before.
 */
export function CopyButton({ text, label, done }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = () => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 2000);
      },
      () => undefined,
    );
  };

  return (
    <>
      <button type="button" className="copy-button" onClick={copy}>
        {copied ? done : label}
      </button>
      {/* Beside the button, not in it: inside, the name would read twice. */}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? done : ''}
      </span>
    </>
  );
}
