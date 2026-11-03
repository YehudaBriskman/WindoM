import { describe, expect, it } from 'vitest';
import { remToPx } from './rem-to-px';

// Vitest stubs every CSS import (even `?raw`) to an empty string, so read the
// sheets from disk. `node:fs` is reached dynamically: the app's tsconfig has no
// Node types, and this is the only test that needs them.
type Fs = { readFileSync(path: URL, encoding: 'utf8'): string };
async function readSheet(name: string): Promise<string> {
  const fs = (await import(/* @vite-ignore */ 'node:' + 'fs')) as Fs;
  return fs.readFileSync(new URL(`../styles/${name}`, import.meta.url), 'utf8');
}

const REM_LENGTH = /(?<![\w.-])-?(?:\d+\.?\d*|\.\d+)rem(?![\w-])/i;

describe('remToPx', () => {
  it('converts rem lengths against a 16px root', () => {
    expect(remToPx('a{font-size:1.25rem;margin:.5rem 0 -1rem 2REM}')).toBe('a{font-size:20px;margin:8px 0 -16px 32px}');
  });

  it('converts inside calc() and keeps fractional pixels', () => {
    expect(remToPx('a{width:calc(100% - 0.775rem)}')).toBe('a{width:calc(100% - 12.4px)}');
  });

  it('leaves em, other units and identifiers alone', () => {
    const css = '.mt-1rem{letter-spacing:-0.04em;--gap-2rem:3px;width:2rems;height:1remx;top:10px}';
    expect(remToPx(css)).toBe(css);
  });

  it('leaves no rem length in the sheets the content script injects', async () => {
    const sheets = (await readSheet('globals.css')) + (await readSheet('glass.css'));
    // The sheets use rem today, so the conversion has work to do.
    expect(sheets).toMatch(REM_LENGTH);
    expect(remToPx(sheets)).not.toMatch(REM_LENGTH);
  });
});
