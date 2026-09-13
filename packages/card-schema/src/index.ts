/**
 * Card Schema Package
 *
 * Defines and validates practice card structure.
 */

// Export types
export type {
  Suit,
  Rank,
  DragonColor,
  Wind,
  FlowerNumber,
  TileIdentity,
  VariableDomain,
  HandVariables,
  GroupKind,
  Group,
  ConstraintType,
  Constraint,
  Hand,
  Ruleset,
} from './types.js';

// Export validator
export { ValidationError, validateHand, validateRuleset, countOf } from './validator.js';

// Export parser
export {
  parseHand,
  parseRuleset,
  loadHandFromFile,
  loadRulesetFromFile,
} from './parser.js';
