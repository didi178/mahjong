/**
 * Card Schema Types
 *
 * Type definitions for practice card hands.
 * Hands consist of variables, groups, and constraints.
 */

import type { Suit, Rank, DragonColor, Wind, FlowerNumber, TileId, InventorySpec } from '@mahjong/tile-model';

// ============================================================================
// Re-export tile primitives for convenience
// ============================================================================

export type { Suit, Rank, DragonColor, Wind, FlowerNumber, TileId, InventorySpec };

// ============================================================================
// Variable References and Slots
// ============================================================================

export interface VariableRef {
  kind: 'var';
  name: string;
}

// A tile SLOT in a hand template can have variables in different positions
export type SuitSlot = Suit | VariableRef;
export type RankSlot = Rank | VariableRef;

export type TileSlot =
  | { kind: 'suit'; suit: SuitSlot; rank: RankSlot }
  | { kind: 'wind'; direction: Wind | VariableRef }
  | { kind: 'dragon'; color: DragonColor | VariableRef }
  | { kind: 'flower'; number: FlowerNumber | VariableRef }
  | { kind: 'joker' }; // Jokers are never slots (they're substitutes, not templates)

// Legacy type for backward compatibility with existing YAML parsing
export type TileIdentity =
  | { suit: string; rank: string } // Will be normalized to TileSlot
  | { honor: 'dragon'; color: DragonColor }
  | { honor: 'wind'; direction: Wind }
  | { flower: FlowerNumber }
  | { joker: true };

// ============================================================================
// Variables & Domains
// ============================================================================

export type VariableDomain =
  | { type: 'suit'; values?: Suit[] } // All suits if values omitted
  | { type: 'rank'; values?: Rank[] } // 1-9 if values omitted
  | { type: 'dragon'; values?: DragonColor[] }
  | { type: 'wind'; values?: Wind[] }
  | { type: 'flower'; values?: FlowerNumber[] };

export interface HandVariables {
  [varName: string]: VariableDomain;
}

// ============================================================================
// Groups
// ============================================================================

export type GroupKind = 'single' | 'pair' | 'pung' | 'kong' | 'quint';

export interface Group {
  kind: GroupKind;
  tile: TileIdentity; // TODO: migrate to TileSlot after parser normalization
  joker_allowed: boolean;
  exposure_group?: string; // e.g., "A", "B" - groups that expose together
  distinct_identities?: boolean; // For flower pairs with different flowers
}

// ============================================================================
// Constraints
// ============================================================================

export type ConstraintType =
  'distinct' | 'equal' | 'consecutive' | 'parity' | 'in_set' | 'offset' | 'forbid_kind';

export type Constraint =
  | { type: 'distinct'; vars: string[] }
  | { type: 'equal'; vars: string[] }
  | { type: 'consecutive'; vars: string[]; step: number }
  | { type: 'parity'; vars: string[]; parity: 'odd' | 'even' }
  | { type: 'in_set'; var: string; values: (Rank | Suit | DragonColor | Wind)[] }
  | { type: 'offset'; vars: [string, string]; delta: number }
  | { type: 'forbid_kind'; kinds: ('honor' | 'flower' | 'joker')[] };

// ============================================================================
// Hand Definition
// ============================================================================

export interface Hand {
  id: string;
  name: string;
  concealed: boolean;
  variables?: HandVariables;
  groups: Group[];
  constraints?: Constraint[];
}

// ============================================================================
// Ruleset
// ============================================================================

export interface Ruleset {
  id: string;
  name: string;
  version: string;
  charleston: {
    enabled: boolean;
    passes: number;
    direction_sequence: ('right' | 'across' | 'left')[];
    second_charleston: boolean;
    blind_pass_allowed: 'last_only' | 'any' | 'never';
  };
  calling: {
    last_discard_mahjong_only: boolean;
    priority: 'mahjong_first' | 'seat_order';
  };
  jokers: {
    exchange_timing: 'own_turn_only' | 'any_turn';
    allowed_in_concealed: boolean;
    allowed_in_singles: boolean;
    allowed_in_pairs: boolean;
  };
  flowers: {
    treatment: 'pattern_elements' | 'bonus_draws';
  };
  wall: {
    size: number;
    include_flowers: boolean;
  };
  game_end: {
    invalid_mahjong: 'dead_hand' | 'continue';
    draw_game: 'no_winner' | 'seated_closest';
  };
  content: {
    cards_source: 'user_authored_only' | 'licensed_allowed';
    primary_language: string;
  };
  tiles: InventorySpec; // Added per architect guidance
}
