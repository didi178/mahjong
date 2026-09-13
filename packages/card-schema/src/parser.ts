/**
 * YAML Parser for Card Schema
 *
 * Loads and validates hand/ruleset definitions from YAML files.
 */

import { parse as parseYAML } from 'yaml';
import type { Hand, Ruleset } from './types.js';
import { validateHand, validateRuleset, ValidationError } from './validator.js';

/**
 * Parse a hand definition from YAML string.
 */
export function parseHand(yaml: string, ruleset: Ruleset): Hand {
  let parsed: unknown;
  try {
    parsed = parseYAML(yaml, { strict: true, uniqueKeys: true });
  } catch (err) {
    throw new ValidationError(
      `YAML parse error: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new ValidationError('Hand must be an object');
  }

  const hand = parsed as Hand;
  validateHand(hand, ruleset);
  return hand;
}

/**
 * Parse a ruleset definition from YAML string.
 */
export function parseRuleset(yaml: string): Ruleset {
  let parsed: unknown;
  try {
    parsed = parseYAML(yaml, { strict: true, uniqueKeys: true });
  } catch (err) {
    throw new ValidationError(
      `YAML parse error: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new ValidationError('Ruleset must be an object');
  }

  const ruleset = parsed as Ruleset;
  validateRuleset(ruleset);
  return ruleset;
}

/**
 * Load hand from file content (for Node.js environment).
 */
export async function loadHandFromFile(
  content: string,
  ruleset: Ruleset
): Promise<Hand> {
  return parseHand(content, ruleset);
}

/**
 * Load ruleset from file content (for Node.js environment).
 */
export async function loadRulesetFromFile(content: string): Promise<Ruleset> {
  return parseRuleset(content);
}
