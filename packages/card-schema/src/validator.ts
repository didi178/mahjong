/**
 * Card Schema Validator
 *
 * Validates hand definitions against schema rules.
 */

import type {
  Hand,
  Group,
  GroupKind,
  Constraint,
  Ruleset,
  HandVariables,
} from './types.js';

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly path?: string
  ) {
    super(path ? `${path}: ${message}` : message);
    this.name = 'ValidationError';
  }
}

/**
 * Get the tile count for a group kind.
 */
export function countOf(kind: GroupKind): number {
  switch (kind) {
    case 'single':
      return 1;
    case 'pair':
      return 2;
    case 'pung':
      return 3;
    case 'kong':
      return 4;
    case 'quint':
      return 5;
  }
}

/**
 * Validate a hand definition.
 * Returns an array of error messages (empty array if valid).
 */
export function validateHand(hand: Hand, ruleset?: Ruleset): string[] {
  const errors: string[] = [];

  // Validate required fields
  if (!hand.id || typeof hand.id !== 'string') {
    errors.push('Hand ID must be a non-empty string');
    return errors; // Can't continue without a valid ID
  }

  if (!hand.name || typeof hand.name !== 'string') {
    errors.push(`${hand.id}: Hand name must be a non-empty string`);
  }

  if (typeof hand.concealed !== 'boolean') {
    errors.push(`${hand.id}: concealed must be a boolean`);
  }

  if (!Array.isArray(hand.groups) || hand.groups.length === 0) {
    errors.push(`${hand.id}: Hand must have at least one group`);
    return errors; // Can't validate groups if they don't exist
  }

  // Validate groups (only with ruleset if provided)
  for (let i = 0; i < hand.groups.length; i++) {
    try {
      validateGroup(hand.groups[i]!, ruleset, hand.variables, `${hand.id}.groups[${i}]`);
    } catch (err) {
      if (err instanceof ValidationError) {
        errors.push(err.message);
      } else {
        errors.push(`${hand.id}.groups[${i}]: ${String(err)}`);
      }
    }
  }

  // Validate constraints
  if (hand.constraints) {
    const varNames = new Set(Object.keys(hand.variables || {}));
    for (let i = 0; i < hand.constraints.length; i++) {
      try {
        validateConstraint(hand.constraints[i]!, varNames, `${hand.id}.constraints[${i}]`);
      } catch (err) {
        if (err instanceof ValidationError) {
          errors.push(err.message);
        } else {
          errors.push(`${hand.id}.constraints[${i}]: ${String(err)}`);
        }
      }
    }
  }

  // Validate total tile count (standard hand is 14 tiles)
  const totalTiles = hand.groups.reduce((sum, g) => sum + countOf(g.kind), 0);
  if (totalTiles !== 14) {
    errors.push(`${hand.id}: Hand must total exactly 14 tiles, got ${totalTiles}`);
  }

  return errors;
}

/**
 * Validate a single group.
 */
function validateGroup(
  group: Group,
  ruleset: Ruleset | undefined,
  variables: HandVariables | undefined,
  path: string
): void {
  // Validate kind
  const validKinds: GroupKind[] = ['single', 'pair', 'pung', 'kong', 'quint'];
  if (!validKinds.includes(group.kind)) {
    throw new ValidationError(`Invalid kind: ${group.kind}`, path);
  }

  // Validate joker_allowed against ruleset (only if ruleset provided)
  if (group.joker_allowed && ruleset) {
    if (group.kind === 'single' && !ruleset.jokers.allowed_in_singles) {
      throw new ValidationError(
        `Jokers not allowed in singles per ruleset`,
        `${path}.joker_allowed`
      );
    }
    if (group.kind === 'pair' && !ruleset.jokers.allowed_in_pairs) {
      throw new ValidationError(
        `Jokers not allowed in pairs per ruleset`,
        `${path}.joker_allowed`
      );
    }
  }

  // Validate tile identity - check if variables are defined
  const tile = group.tile;
  if ('suit' in tile && 'rank' in tile) {
    if (variables) {
      if (typeof tile.suit === 'string' && !(tile.suit in variables)) {
        throw new ValidationError(
          `Undefined variable: ${tile.suit}`,
          `${path}.tile.suit`
        );
      }
      if (typeof tile.rank === 'string' && !(tile.rank in variables)) {
        throw new ValidationError(
          `Undefined variable: ${tile.rank}`,
          `${path}.tile.rank`
        );
      }
    }
  }
}

/**
 * Validate a constraint.
 */
function validateConstraint(
  constraint: Constraint,
  varNames: Set<string>,
  path: string
): void {
  switch (constraint.type) {
    case 'distinct':
    case 'equal':
      if (!Array.isArray(constraint.vars) || constraint.vars.length < 2) {
        throw new ValidationError(
          `${constraint.type} constraint requires at least 2 variables`,
          path
        );
      }
      for (const v of constraint.vars) {
        if (!varNames.has(v)) {
          throw new ValidationError(`Undefined variable: ${v}`, path);
        }
      }
      break;

    case 'consecutive':
      if (!Array.isArray(constraint.vars) || constraint.vars.length < 2) {
        throw new ValidationError(
          'consecutive constraint requires at least 2 variables',
          path
        );
      }
      if (typeof constraint.step !== 'number' || constraint.step < 1) {
        throw new ValidationError('consecutive step must be a positive number', path);
      }
      for (const v of constraint.vars) {
        if (!varNames.has(v)) {
          throw new ValidationError(`Undefined variable: ${v}`, path);
        }
      }
      break;

    case 'parity':
      if (!Array.isArray(constraint.vars) || constraint.vars.length === 0) {
        throw new ValidationError('parity constraint requires at least 1 variable', path);
      }
      if (constraint.parity !== 'odd' && constraint.parity !== 'even') {
        throw new ValidationError(`Invalid parity: ${constraint.parity}`, path);
      }
      for (const v of constraint.vars) {
        if (!varNames.has(v)) {
          throw new ValidationError(`Undefined variable: ${v}`, path);
        }
      }
      break;

    case 'in_set':
      if (!varNames.has(constraint.var)) {
        throw new ValidationError(`Undefined variable: ${constraint.var}`, path);
      }
      if (!Array.isArray(constraint.values) || constraint.values.length === 0) {
        throw new ValidationError('in_set constraint requires non-empty values array', path);
      }
      break;

    case 'offset':
      if (!Array.isArray(constraint.vars) || constraint.vars.length !== 2) {
        throw new ValidationError('offset constraint requires exactly 2 variables', path);
      }
      if (typeof constraint.delta !== 'number') {
        throw new ValidationError('offset delta must be a number', path);
      }
      for (const v of constraint.vars) {
        if (!varNames.has(v)) {
          throw new ValidationError(`Undefined variable: ${v}`, path);
        }
      }
      break;

    case 'forbid_kind':
      if (!Array.isArray(constraint.kinds) || constraint.kinds.length === 0) {
        throw new ValidationError(
          'forbid_kind constraint requires non-empty kinds array',
          path
        );
      }
      break;
  }
}

/**
 * Validate a ruleset definition.
 */
export function validateRuleset(ruleset: Ruleset): void {
  if (!ruleset.id || !ruleset.name || !ruleset.version) {
    throw new ValidationError('Ruleset must have id, name, and version');
  }

  // Validate charleston
  if (ruleset.charleston.enabled) {
    if (ruleset.charleston.passes < 1) {
      throw new ValidationError('Charleston must have at least 1 pass');
    }
    if (ruleset.charleston.direction_sequence.length !== ruleset.charleston.passes) {
      throw new ValidationError('Direction sequence length must match passes count');
    }
  }

  // Validate content source
  const validSources = ['user_authored_only', 'licensed_allowed'];
  if (!validSources.includes(ruleset.content.cards_source)) {
    throw new ValidationError(`Invalid cards_source: ${ruleset.content.cards_source}`);
  }
}
