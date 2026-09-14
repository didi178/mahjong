/**
 * Drift-Catching Tests
 *
 * These tests catch regressions in the ruleset and hand definitions:
 * - Ruleset inventory must match tile-model's calculation
 * - All constraint predicates must be exercised by at least one hand
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { parseRuleset, parseHand } from './parser.js';
import { totalTileCount } from '@mahjong/tile-model';
import type { Hand } from './types.js';

describe('Ruleset Drift Tests', () => {
  it('practice ruleset: totalTileCount === 152', async () => {
    const rulesetPath = join(process.cwd(), '../../content/rulesets/practice.yaml');
    const yaml = await readFile(rulesetPath, 'utf-8');
    const ruleset = parseRuleset(yaml);

    const count = totalTileCount(ruleset.tiles);
    expect(count).toBe(152);
  });
});

describe('Constraint Coverage Tests', () => {
  it('all 7 constraint predicates are exercised by at least one hand', async () => {
    // Load all hands
    const handsDir = join(process.cwd(), '../../content/practice-card');
    const files = await readdir(handsDir);
    const handFiles = files.filter((f) => f.endsWith('.yaml') && f.startsWith('hand-'));

    const hands: Hand[] = [];
    for (const file of handFiles) {
      const yaml = await readFile(join(handsDir, file), 'utf-8');
      const hand = parseHand(yaml);
      hands.push(hand);
    }

    // Collect all constraint types used
    const usedConstraints = new Set<string>();
    for (const hand of hands) {
      if (hand.constraints) {
        for (const constraint of hand.constraints) {
          usedConstraints.add(constraint.type);
        }
      }
    }

    // The closed constraint vocabulary from AC2
    const requiredConstraints = [
      'distinct',
      'equal',
      'consecutive',
      'parity',
      'in_set',
      'offset',
      'forbid_kind',
    ];

    for (const required of requiredConstraints) {
      expect(usedConstraints.has(required)).toBe(true);
    }
  });
});
