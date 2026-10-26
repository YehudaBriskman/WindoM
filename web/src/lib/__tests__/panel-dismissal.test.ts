import { beforeEach, describe, expect, it } from 'vitest';
import { shouldDismissPanel } from '../panel-dismissal';

/**
 * Pins the bug where connecting an integration closed the settings panel.
 *
 * The app centre renders as a sibling of the panel, so its Connect buttons are
 * "outside" it by DOM containment while plainly belonging to it by intent.
 */

let panel: HTMLElement;
let appCenter: HTMLElement;
let backdrop: HTMLElement;
let elsewhere: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = `
    <div class="settings-container glass-panel">
      <button id="inside-panel">Apps</button>
    </div>
    <div class="app-center-backdrop"></div>
    <div class="app-center-panel glass-panel">
      <div class="app-center-body">
        <button id="connect-spotify">Connect Spotify</button>
      </div>
    </div>
    <div id="wallpaper"></div>
  `;
  panel = document.querySelector('.settings-container')!;
  appCenter = document.querySelector('.app-center-panel')!;
  backdrop = document.querySelector('.app-center-backdrop')!;
  elsewhere = document.querySelector('#wallpaper')!;
});

describe('shouldDismissPanel', () => {
  it('dismisses on a click away from everything', () => {
    expect(shouldDismissPanel(elsewhere, panel)).toBe(true);
  });

  it('does not dismiss on a click inside the panel', () => {
    expect(shouldDismissPanel(document.querySelector('#inside-panel'), panel)).toBe(false);
  });

  it('does not dismiss when connecting an app from the app centre', () => {
    // The actual reported bug: this button is a sibling of the panel.
    expect(shouldDismissPanel(document.querySelector('#connect-spotify'), panel)).toBe(false);
  });

  it('does not dismiss on the app centre itself', () => {
    expect(shouldDismissPanel(appCenter, panel)).toBe(false);
  });

  it('does not dismiss on the app centre backdrop, which closes only the app centre', () => {
    expect(shouldDismissPanel(backdrop, panel)).toBe(false);
  });

  it('resolves a text node to its parent element', () => {
    const text = document.querySelector('#connect-spotify')!.firstChild;
    expect(text?.nodeType).toBe(Node.TEXT_NODE);
    expect(shouldDismissPanel(text, panel)).toBe(false);
  });

  it('does not dismiss when the panel is not mounted', () => {
    expect(shouldDismissPanel(elsewhere, null)).toBe(false);
  });

  it('dismisses on a null target away from the panel', () => {
    expect(shouldDismissPanel(null, panel)).toBe(true);
  });
});
