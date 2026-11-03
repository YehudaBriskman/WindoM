import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName, is } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import type { z } from 'zod';
import * as schema from '../../db/schema.js';
import { EXPORT_POLICY, SETTINGS_EXPORTED, SETTINGS_WITHHELD } from '../export.service.js';
import { settingsSectionSchema } from '../../controllers/settings.controller.js';

/**
 * Guards GET /me/export (#265) against leaking a future secret by default. Adding a table
 * or a column to schema.ts, or a key to the settings validator, fails here until it is
 * classified in export.service.ts as exported or withheld.
 */

const tables = Object.values(schema).filter((v): v is PgTable => is(v, PgTable));
const policies = Object.values(EXPORT_POLICY);

describe('export policy covers the whole schema', () => {
  it('has a policy for every table in schema.ts', () => {
    expect(tables.length).toBeGreaterThan(0);
    const covered = new Set(policies.map((p) => getTableName(p.table)));
    expect(tables.map((t) => getTableName(t)).filter((t) => !covered.has(t))).toEqual([]);
  });

  for (const p of policies) {
    const name = getTableName(p.table);
    it(`classifies every column of ${name} exactly once`, () => {
      const columns = Object.keys(getTableColumns(p.table)).sort();
      const exported: string[] = [...p.exported];
      const withheld = Object.keys(p.withheld);
      expect(exported.filter((c) => withheld.includes(c))).toEqual([]);
      expect([...exported, ...withheld].sort()).toEqual(columns);
    });
  }

  it('never exports a column whose name looks like a credential', () => {
    const suspicious = /hash|token|secret|password|state|enc$|lookup/i;
    for (const p of policies) {
      for (const col of p.exported as readonly string[]) {
        // A timestamp, not a token.
        if (col === 'tokenExpiresAt') continue;
        expect(col, `${getTableName(p.table)}.${col}`).not.toMatch(suspicious);
      }
    }
  });
});

describe('settings allowlist covers the settings validator', () => {
  const sections = settingsSectionSchema.shape;

  it('classifies every key of every section exactly once', () => {
    for (const [section, field] of Object.entries(sections)) {
      if (section === '_updatedAt') continue; // stripped before storage
      const inner = (field as z.ZodOptional<z.ZodObject<z.ZodRawShape>>).unwrap();
      const keys = Object.keys(inner.shape).sort();
      const exported = SETTINGS_EXPORTED[section] ?? [];
      const withheld = SETTINGS_WITHHELD[section] ?? [];
      expect(exported.filter((k) => withheld.includes(k)), section).toEqual([]);
      expect([...exported, ...withheld].sort(), section).toEqual(keys);
    }
  });

  it('has no allowlist entry for a section the validator does not know', () => {
    const known = Object.keys(sections);
    for (const s of [...Object.keys(SETTINGS_EXPORTED), ...Object.keys(SETTINGS_WITHHELD)]) {
      expect(known).toContain(s);
    }
  });
});
