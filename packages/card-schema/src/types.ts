/**
 * Card Schema Types
 *
 * Type definitions for practice card hands.
 * Hands consist of variables, groups, and constraints.
 */

// ============================================================================
// Tile Identities
// ============================================================================

export type Suit = 'crak' | 'bam' | 'dot';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type DragonColor = 'red' | 'green' | 'white';
export type Wind = 'north' | 'east' | 'south' | 'west';
export type FlowerNumber = 1 | 2 | 3 | 4;

export type TileIdentity =
  | { suit: string; rank: string } // Variable refs
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
  tile: TileIdentity;
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
}
