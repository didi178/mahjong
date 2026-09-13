/**
 * Validator tests for card-schema
 *
 * Includes a critical test that validates all shipped practice hands
 * to prevent regression of the 14-tile requirement.
 */

import { describe, it, expect } from 'vitest';
import { validateHand, countOf } from './validator.js';
import { loadHandFromFile } from './parser.js';
import { Hand, GroupKind } from './types.js';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../../..');

async function findYamlFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.yaml'))
      .map((entry) => join(dir, entry.name));
  } catch {
    return [];
  }
}

describe('countOf', () => {
  it('should return correct tile count for each group kind', () => {
    expect(countOf('single' as GroupKind)).toBe(1);
    expect(countOf('pair' as GroupKind)).toBe(2);
    expect(countOf('pung' as GroupKind)).toBe(3);
    expect(countOf('kong' as GroupKind)).toBe(4);
    expect(countOf('quint' as GroupKind)).toBe(5);
  });
});

describe('validateHand', () => {
  it('should accept a valid minimal hand', () => {
    const hand: Hand = {
      id: 'test-hand',
      name: 'Test Hand',
      concealed: false,
      variables: {},
      groups: [
        {
          kind: 'pung',
          tile: { honor: 'wind', direction: 'east' },
          joker_allowed: true,
        },
        {
          kind: 'pung',
          tile: { honor: 'wind', direction: 'west' },
          joker_allowed: true,
        },
        {
          kind: 'pung',
          tile: { honor: 'dragon', color: 'red' },
          joker_allowed: true,
        },
        {
          kind: 'pung',
          tile: { honor: 'dragon', color: 'green' },
          joker_allowed: true,
        },
        {
          kind: 'pair',
          tile: { honor: 'dragon', color: 'white' },
          joker_allowed: false,
        },
      ],
      constraints: [],
    };

    const errors = validateHand(hand);
    expect(errors).toEqual([]);
  });

  it('should reject a hand with incorrect tile count', () => {
    const hand: Hand = {
      id: 'bad-hand',
      name: 'Bad Hand',
      concealed: false,
      variables: {},
      groups: [
        {
          kind: 'pung',
          tile: { honor: 'wind', direction: 'east' },
          joker_allowed: true,
        },
        {
          kind: 'pair',
          tile: { honor: 'wind', direction: 'west' },
          joker_allowed: false,
        },
      ],
      constraints: [],
    };

    const errors = validateHand(hand);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('must total exactly 14 tiles'))).toBe(true);
  });

  it('should validate variable references', () => {
    const hand: Hand = {
      id: 'var-hand',
      name: 'Variable Hand',
      concealed: false,
      variables: {
        S: { type: 'suit' },
      },
      groups: [
        {
          kind: 'pung',
          tile: { suit: 'S', rank: 1 },
          joker_allowed: true,
        },
        {
          kind: 'pung',
          tile: { suit: 'S', rank: 2 },
          joker_allowed: true,
        },
        {
          kind: 'pung',
          tile: { suit: 'S', rank: 3 },
          joker_allowed: true,
        },
        {
          kind: 'pung',
          tile: { suit: 'S', rank: 4 },
          joker_allowed: true,
        },
        {
          kind: 'pair',
          tile: { flower: 1 },
          joker_allowed: false,
        },
      ],
      constraints: [],
    };

    const errors = validateHand(hand);
    expect(errors).toEqual([]);
  });

  it('should reject undefined variable references', () => {
    const hand: Hand = {
      id: 'bad-var-hand',
      name: 'Bad Variable Hand',
      concealed: false,
      variables: {},
      groups: [
        {
          kind: 'pung',
          tile: { suit: 'UNDEFINED', rank: 1 },
          joker_allowed: true,
        },
      ],
      constraints: [],
    };

    const errors = validateHand(hand);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('Undefined variable'))).toBe(true);
  });
});

describe('All shipped practice hands', () => {
  it('should validate that every practice hand totals exactly 14 tiles', async () => {
    const handFiles = await findYamlFiles(join(repoRoot, 'content/practice-card'));

    expect(handFiles.length).toBeGreaterThan(0);

    const results = await Promise.all(
      handFiles.map(async (file) => {
        const hand = await loadHandFromFile(file);
        const tileCount = hand.groups.reduce((sum, group) => sum + countOf(group.kind), 0);

        return {
          file,
          id: hand.id,
          tileCount,
          isValid: tileCount === 14,
        };
      })
    );

    const invalid = results.filter((r) => !r.isValid);

    if (invalid.length > 0) {
      const message = invalid
        .map((r) => `  ${r.file} (${r.id}): ${r.tileCount} tiles`)
        .join('\n');
      throw new Error(
        `Found ${invalid.length} hand(s) with incorrect tile count:\n${message}\n\nAll hands must total exactly 14 tiles.`
      );
    }

    expect(results.every((r) => r.isValid)).toBe(true);
  });

  it('should validate all practice hands against the schema', async () => {
    const handFiles = await findYamlFiles(join(repoRoot, 'content/practice-card'));

    expect(handFiles.length).toBeGreaterThan(0);

    for (const file of handFiles) {
      const hand = await loadHandFromFile(file);
      const errors = validateHand(hand);

      expect(errors, `${file} should have no validation errors`).toEqual([]);
    }
  });
});
