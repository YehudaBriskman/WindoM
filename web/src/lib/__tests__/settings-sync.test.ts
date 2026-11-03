import { describe, it, expect } from 'vitest';
import { planSync, revisionAfterPush, type PlanInput } from '../settings-sync';

const HOUR = 60 * 60 * 1000;
const SERVER_NOW = 1_800_000_000_000;

function input(over: Partial<PlanInput>): PlanInput {
  return {
    backendEmpty: false,
    backendWins: false,
    serverRev: SERVER_NOW,
    baseRev: SERVER_NOW,
    dirtySections: [],
    legacyLocalUpdatedAt: 0,
    syncableSections: ['general', 'clock', 'weather'],
    ...over,
  };
}

describe('planSync (#251)', () => {
  it('uploads everything when the server holds nothing', () => {
    expect(planSync(input({ backendEmpty: true }))).toEqual({ kind: 'push-all' });
  });

  it('login: the account copy wins outright', () => {
    expect(planSync(input({ backendWins: true, dirtySections: ['clock'] }))).toEqual({ kind: 'pull', keepLocal: [] });
  });

  it('server unchanged since our last sync: push only our edits', () => {
    expect(planSync(input({ dirtySections: ['clock'] }))).toEqual({ kind: 'push-dirty' });
  });

  it('server moved on: adopt it, keeping unsynced local sections', () => {
    expect(planSync(input({ serverRev: SERVER_NOW + 5, dirtySections: ['clock'] })))
      .toEqual({ kind: 'pull', keepLocal: ['clock'] });
  });

  it('decides by revision equality, so any amount of client clock skew is irrelevant', () => {
    // Once a base revision exists the only client-clock value in the input (the
    // legacy stamp) is ignored, however far that clock drifted.
    for (const skew of [-24 * HOUR, -5 * HOUR, 0, 5 * HOUR, 24 * HOUR]) {
      const legacy = SERVER_NOW + skew;
      expect(planSync(input({ serverRev: SERVER_NOW + 1, legacyLocalUpdatedAt: legacy })))
        .toEqual({ kind: 'pull', keepLocal: [] });
      expect(planSync(input({ legacyLocalUpdatedAt: legacy, dirtySections: ['general'] })))
        .toEqual({ kind: 'push-dirty' });
    }
  });

  it('pre-#251 backend (no revision): pull but keep unsynced local edits', () => {
    expect(planSync(input({ serverRev: undefined, dirtySections: ['general'] })))
      .toEqual({ kind: 'pull', keepLocal: ['general'] });
  });

  describe('first sync after upgrading (no base revision yet)', () => {
    it('a device whose last local edit is newer than the server keeps its settings', () => {
      expect(planSync(input({ baseRev: undefined, legacyLocalUpdatedAt: SERVER_NOW + 1000 })))
        .toEqual({ kind: 'pull', keepLocal: ['general', 'clock', 'weather'] });
    });

    it('a device that never edited, or edited before the server copy, takes the server copy', () => {
      expect(planSync(input({ baseRev: undefined, legacyLocalUpdatedAt: 0 }))).toEqual({ kind: 'pull', keepLocal: [] });
      expect(planSync(input({ baseRev: undefined, legacyLocalUpdatedAt: SERVER_NOW - 1000 })))
        .toEqual({ kind: 'pull', keepLocal: [] });
    });
  });
});

describe('revisionAfterPush', () => {
  it('advances when our write landed directly on the revision we knew', () => {
    expect(revisionAfterPush(10, { data: {}, updatedAt: 20, previousUpdatedAt: 10 })).toBe(20);
    expect(revisionAfterPush(null, { data: {}, updatedAt: 20, previousUpdatedAt: null })).toBe(20);
  });

  it('holds back when another device wrote in between, so the next load pulls', () => {
    expect(revisionAfterPush(10, { data: {}, updatedAt: 30, previousUpdatedAt: 20 })).toBeUndefined();
  });

  it('holds back against a pre-#251 backend that returns no revision', () => {
    expect(revisionAfterPush(10, { data: {} })).toBeUndefined();
  });
});
