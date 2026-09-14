/**
 * Tile Model Package
 *
 * Canonical tile identities and operations for Mahjong Academy.
 * Zero runtime dependencies. Provides the physical-tile primitive layer:
 * no rules, no cards, no game state — just tile identity and multiset operations.
 */

// ============================================================================
// Primitive types (shared with card-schema)
// ============================================================================

export type Suit = 'crak' | 'bam' | 'dot';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type DragonColor = 'red' | 'green' | 'white';
export type Wind = 'north' | 'east' | 'south' | 'west';
export type FlowerNumber = 1 | 2 | 3 | 4;

// ============================================================================
// TileId — Canonical tile identity
// ============================================================================

export type TileId =
  | { kind: 'suit'; suit: Suit; rank: Rank }
  | { kind: 'wind'; direction: Wind }
  | { kind: 'dragon'; color: DragonColor }
  | { kind: 'flower'; number: FlowerNumber }
  | { kind: 'joker' };

// ============================================================================
// Canonical string representation (stable, sortable, golden-friendly)
// ============================================================================

export function toCanonicalString(t: TileId): string {
  switch (t.kind) {
    case 'suit':
      return `suit:${t.suit}:${t.rank}`;
    case 'wind':
      return `wind:${t.direction}`;
    case 'dragon':
      return `dragon:${t.color}`;
    case 'flower':
      return `flower:${t.number}`;
    case 'joker':
      return 'joker';
  }
}

export function fromCanonicalString(s: string): TileId {
  const parts = s.split(':');

  if (parts[0] === 'suit') {
    if (parts.length !== 3) throw new Error(`Invalid suit tile string: ${s}`);
    const suit = parts[1]!;
    const rank = parseInt(parts[2]!, 10);
    if (!['crak', 'bam', 'dot'].includes(suit)) {
      throw new Error(`Invalid suit: ${suit}`);
    }
    if (![1, 2, 3, 4, 5, 6, 7, 8, 9].includes(rank)) {
      throw new Error(`Invalid rank: ${rank}`);
    }
    return { kind: 'suit', suit: suit as Suit, rank: rank as Rank };
  }

  if (parts[0] === 'wind') {
    if (parts.length !== 2) throw new Error(`Invalid wind tile string: ${s}`);
    const direction = parts[1]!;
    if (!['north', 'east', 'south', 'west'].includes(direction)) {
      throw new Error(`Invalid wind direction: ${direction}`);
    }
    return { kind: 'wind', direction: direction as 'north' | 'east' | 'south' | 'west' };
  }

  if (parts[0] === 'dragon') {
    if (parts.length !== 2) throw new Error(`Invalid dragon tile string: ${s}`);
    const color = parts[1]!;
    if (!['red', 'green', 'white'].includes(color)) {
      throw new Error(`Invalid dragon color: ${color}`);
    }
    return { kind: 'dragon', color: color as 'red' | 'green' | 'white' };
  }

  if (parts[0] === 'flower') {
    if (parts.length !== 2) throw new Error(`Invalid flower tile string: ${s}`);
    const number = parseInt(parts[1]!, 10);
    if (![1, 2, 3, 4].includes(number)) {
      throw new Error(`Invalid flower number: ${number}`);
    }
    return { kind: 'flower', number: number as 1 | 2 | 3 | 4 };
  }

  if (s === 'joker') {
    return { kind: 'joker' };
  }

  throw new Error(`Invalid tile string: ${s}`);
}

// ============================================================================
// Structural equality (never JSON.stringify — property order is fragile)
// ============================================================================

export function equals(a: TileId, b: TileId): boolean {
  if (a.kind !== b.kind) return false;

  switch (a.kind) {
    case 'suit':
      return b.kind === 'suit' && a.suit === b.suit && a.rank === b.rank;
    case 'wind':
      return b.kind === 'wind' && a.direction === b.direction;
    case 'dragon':
      return b.kind === 'dragon' && a.color === b.color;
    case 'flower':
      return b.kind === 'flower' && a.number === b.number;
    case 'joker':
      return b.kind === 'joker';
  }
}

// ============================================================================
// Total ordering (for canonical sorting of multisets in goldens)
// ============================================================================

const KIND_ORDER: Record<TileId['kind'], number> = {
  suit: 0,
  wind: 1,
  dragon: 2,
  flower: 3,
  joker: 4,
};

const SUIT_ORDER: Record<'crak' | 'bam' | 'dot', number> = {
  crak: 0,
  bam: 1,
  dot: 2,
};

const DIRECTION_ORDER: Record<'north' | 'east' | 'south' | 'west', number> = {
  north: 0,
  east: 1,
  south: 2,
  west: 3,
};

const DRAGON_ORDER: Record<'red' | 'green' | 'white', number> = {
  red: 0,
  green: 1,
  white: 2,
};

export function compare(a: TileId, b: TileId): number {
  // Compare by kind first
  const kindDiff = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  if (kindDiff !== 0) return kindDiff;

  // Within same kind, compare by specific fields
  switch (a.kind) {
    case 'suit': {
      if (b.kind !== 'suit') return 0; // Should never happen after kind check
      const suitDiff = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
      if (suitDiff !== 0) return suitDiff;
      return a.rank - b.rank;
    }

    case 'wind':
      if (b.kind !== 'wind') return 0;
      return DIRECTION_ORDER[a.direction] - DIRECTION_ORDER[b.direction];

    case 'dragon':
      if (b.kind !== 'dragon') return 0;
      return DRAGON_ORDER[a.color] - DRAGON_ORDER[b.color];

    case 'flower':
      if (b.kind !== 'flower') return 0;
      return a.number - b.number;

    case 'joker':
      return 0; // All jokers are equal
  }
}

// ============================================================================
// TileMultiset — operations for hand-evaluator hot loops
// ============================================================================

export class TileMultiset {
  private counts: Map<string, number>;

  constructor(counts?: Map<string, number>) {
    this.counts = counts || new Map();
  }

  add(t: TileId, n: number = 1): TileMultiset {
    const key = toCanonicalString(t);
    const newCounts = new Map(this.counts);
    newCounts.set(key, (newCounts.get(key) || 0) + n);
    return new TileMultiset(newCounts);
  }

  remove(t: TileId, n: number = 1): TileMultiset {
    const key = toCanonicalString(t);
    const newCounts = new Map(this.counts);
    const current = newCounts.get(key) || 0;
    const newCount = Math.max(0, current - n);
    if (newCount === 0) {
      newCounts.delete(key);
    } else {
      newCounts.set(key, newCount);
    }
    return new TileMultiset(newCounts);
  }

  count(t: TileId): number {
    return this.counts.get(toCanonicalString(t)) || 0;
  }

  size(): number {
    let total = 0;
    for (const count of this.counts.values()) {
      total += count;
    }
    return total;
  }

  toSortedArray(): TileId[] {
    const tiles: TileId[] = [];
    for (const [key, count] of this.counts) {
      const tile = fromCanonicalString(key);
      for (let i = 0; i < count; i++) {
        tiles.push(tile);
      }
    }
    return tiles.sort(compare);
  }

  static from(tiles: Iterable<TileId>): TileMultiset {
    const counts = new Map<string, number>();
    for (const tile of tiles) {
      const key = toCanonicalString(tile);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return new TileMultiset(counts);
  }
}

// ============================================================================
// Joker semantics (ruleset-agnostic primitives)
// ============================================================================

export function isJoker(t: TileId): boolean {
  return t.kind === 'joker';
}

export function canJokerSubstituteFor(target: TileId): boolean {
  // Jokers can substitute for any tile except other jokers
  return target.kind !== 'joker';
}

// ============================================================================
// Physical inventory (ruleset-driven, not hardcoded)
// ============================================================================

export interface InventorySpec {
  suits: { name: Suit; count: number }[];
  dragons: { color: DragonColor; count: number }[];
  winds: { direction: Wind; count: number }[];
  flowers: { count: number; distinguishable: boolean };
  jokers: { count: number };
}

export function enumerateInventory(spec: InventorySpec): TileMultiset {
  let multiset = new TileMultiset();

  // Add suited tiles
  for (const { name, count } of spec.suits) {
    // count is per-rank, so 36 means 4 of each rank 1-9
    const perRank = count / 9;
    for (let rank = 1; rank <= 9; rank++) {
      multiset = multiset.add({ kind: 'suit', suit: name, rank: rank as Rank }, perRank);
    }
  }

  // Add dragons
  for (const { color, count } of spec.dragons) {
    multiset = multiset.add({ kind: 'dragon', color }, count);
  }

  // Add winds
  for (const { direction, count } of spec.winds) {
    multiset = multiset.add({ kind: 'wind', direction }, count);
  }

  // Add flowers
  if (spec.flowers.distinguishable) {
    // Split evenly across numbers 1..4
    const perNumber = spec.flowers.count / 4;
    for (let number = 1; number <= 4; number++) {
      multiset = multiset.add({ kind: 'flower', number: number as FlowerNumber }, perNumber);
    }
  } else {
    // All flowers are identical (not currently used, but spec allows it)
    multiset = multiset.add({ kind: 'flower', number: 1 }, spec.flowers.count);
  }

  // Add jokers
  multiset = multiset.add({ kind: 'joker' }, spec.jokers.count);

  return multiset;
}

export function totalTileCount(spec: InventorySpec): number {
  let total = 0;

  // Suited tiles
  for (const { count } of spec.suits) {
    total += count;
  }

  // Dragons
  for (const { count } of spec.dragons) {
    total += count;
  }

  // Winds
  for (const { count } of spec.winds) {
    total += count;
  }

  // Flowers
  total += spec.flowers.count;

  // Jokers
  total += spec.jokers.count;

  return total;
}
