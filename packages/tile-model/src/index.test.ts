import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  type TileId,
  toCanonicalString,
  fromCanonicalString,
  equals,
  compare,
  TileMultiset,
  isJoker,
  canJokerSubstituteFor,
  enumerateInventory,
  totalTileCount,
  type InventorySpec,
} from './index';

// ============================================================================
// Arbitraries for property-based testing
// ============================================================================

const suitArb = fc.constantFrom('crak' as const, 'bam' as const, 'dot' as const);
const rankArb = fc.constantFrom(1, 2, 3, 4, 5, 6, 7, 8, 9) as fc.Arbitrary<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>;
const directionArb = fc.constantFrom('north' as const, 'east' as const, 'south' as const, 'west' as const);
const dragonColorArb = fc.constantFrom('red' as const, 'green' as const, 'white' as const);
const flowerNumberArb = fc.constantFrom(1, 2, 3, 4) as fc.Arbitrary<1 | 2 | 3 | 4>;

const tileIdArb: fc.Arbitrary<TileId> = fc.oneof(
  fc.record({ kind: fc.constant('suit' as const), suit: suitArb, rank: rankArb }),
  fc.record({ kind: fc.constant('wind' as const), direction: directionArb }),
  fc.record({ kind: fc.constant('dragon' as const), color: dragonColorArb }),
  fc.record({ kind: fc.constant('flower' as const), number: flowerNumberArb }),
  fc.constant({ kind: 'joker' as const })
);

// ============================================================================
// Canonical string tests
// ============================================================================

describe('toCanonicalString / fromCanonicalString', () => {
  it('are inverses on all TileIds (property-based)', () => {
    fc.assert(
      fc.property(tileIdArb, (tile) => {
        const s = toCanonicalString(tile);
        const roundtrip = fromCanonicalString(s);
        return equals(tile, roundtrip);
      })
    );
  });

  it('produces expected format for suit tiles', () => {
    const tile: TileId = { kind: 'suit', suit: 'crak', rank: 5 };
    expect(toCanonicalString(tile)).toBe('suit:crak:5');
  });

  it('produces expected format for wind tiles', () => {
    const tile: TileId = { kind: 'wind', direction: 'east' };
    expect(toCanonicalString(tile)).toBe('wind:east');
  });

  it('produces expected format for dragon tiles', () => {
    const tile: TileId = { kind: 'dragon', color: 'red' };
    expect(toCanonicalString(tile)).toBe('dragon:red');
  });

  it('produces expected format for flower tiles', () => {
    const tile: TileId = { kind: 'flower', number: 2 };
    expect(toCanonicalString(tile)).toBe('flower:2');
  });

  it('produces expected format for joker', () => {
    const tile: TileId = { kind: 'joker' };
    expect(toCanonicalString(tile)).toBe('joker');
  });

  it('throws on invalid suit string', () => {
    expect(() => fromCanonicalString('suit:invalid:5')).toThrow();
  });

  it('throws on invalid rank', () => {
    expect(() => fromCanonicalString('suit:crak:0')).toThrow();
    expect(() => fromCanonicalString('suit:crak:10')).toThrow();
  });

  it('throws on malformed string', () => {
    expect(() => fromCanonicalString('invalid')).toThrow();
  });
});

// ============================================================================
// equals tests
// ============================================================================

describe('equals', () => {
  it('is reflexive (property-based)', () => {
    fc.assert(
      fc.property(tileIdArb, (tile) => {
        return equals(tile, tile);
      })
    );
  });

  it('is symmetric (property-based)', () => {
    fc.assert(
      fc.property(tileIdArb, tileIdArb, (a, b) => {
        return equals(a, b) === equals(b, a);
      })
    );
  });

  it('returns false for tiles of different kinds', () => {
    const a: TileId = { kind: 'suit', suit: 'crak', rank: 1 };
    const b: TileId = { kind: 'wind', direction: 'north' };
    expect(equals(a, b)).toBe(false);
  });

  it('returns true for identical suit tiles', () => {
    const a: TileId = { kind: 'suit', suit: 'bam', rank: 5 };
    const b: TileId = { kind: 'suit', suit: 'bam', rank: 5 };
    expect(equals(a, b)).toBe(true);
  });

  it('returns false for suit tiles with different ranks', () => {
    const a: TileId = { kind: 'suit', suit: 'dot', rank: 3 };
    const b: TileId = { kind: 'suit', suit: 'dot', rank: 4 };
    expect(equals(a, b)).toBe(false);
  });
});

// ============================================================================
// compare tests
// ============================================================================

describe('compare', () => {
  it('is antisymmetric: compare(a,b) = -compare(b,a) (property-based)', () => {
    fc.assert(
      fc.property(tileIdArb, tileIdArb, (a, b) => {
        return compare(a, b) === -compare(b, a);
      })
    );
  });

  it('is transitive (property-based)', () => {
    fc.assert(
      fc.property(tileIdArb, tileIdArb, tileIdArb, (a, b, c) => {
        if (compare(a, b) <= 0 && compare(b, c) <= 0) {
          return compare(a, c) <= 0;
        }
        return true; // No constraint if antecedent doesn't hold
      })
    );
  });

  it('is total: compare(a,b) !== 0 || equals(a,b) (property-based)', () => {
    fc.assert(
      fc.property(tileIdArb, tileIdArb, (a, b) => {
        const cmp = compare(a, b);
        return cmp !== 0 || equals(a, b);
      })
    );
  });

  it('orders kinds: suit < wind < dragon < flower < joker', () => {
    const suit: TileId = { kind: 'suit', suit: 'crak', rank: 1 };
    const wind: TileId = { kind: 'wind', direction: 'north' };
    const dragon: TileId = { kind: 'dragon', color: 'red' };
    const flower: TileId = { kind: 'flower', number: 1 };
    const joker: TileId = { kind: 'joker' };

    expect(compare(suit, wind)).toBeLessThan(0);
    expect(compare(wind, dragon)).toBeLessThan(0);
    expect(compare(dragon, flower)).toBeLessThan(0);
    expect(compare(flower, joker)).toBeLessThan(0);
  });

  it('orders suits within kind: crak < bam < dot', () => {
    const crak: TileId = { kind: 'suit', suit: 'crak', rank: 1 };
    const bam: TileId = { kind: 'suit', suit: 'bam', rank: 1 };
    const dot: TileId = { kind: 'suit', suit: 'dot', rank: 1 };

    expect(compare(crak, bam)).toBeLessThan(0);
    expect(compare(bam, dot)).toBeLessThan(0);
  });

  it('orders ranks within suit', () => {
    const r1: TileId = { kind: 'suit', suit: 'crak', rank: 1 };
    const r2: TileId = { kind: 'suit', suit: 'crak', rank: 2 };
    expect(compare(r1, r2)).toBeLessThan(0);
  });
});

// ============================================================================
// TileMultiset tests
// ============================================================================

describe('TileMultiset', () => {
  it('add(t, n).count(t) - m.count(t) === n (property-based)', () => {
    fc.assert(
      fc.property(tileIdArb, fc.integer({ min: 1, max: 10 }), (tile, n) => {
        const m = new TileMultiset();
        const initialCount = m.count(tile);
        const m2 = m.add(tile, n);
        return m2.count(tile) - initialCount === n;
      })
    );
  });

  it('remove(add(m, t), t).equals(m) structurally (property-based)', () => {
    fc.assert(
      fc.property(tileIdArb, fc.integer({ min: 1, max: 5 }), (tile, n) => {
        const m = new TileMultiset();
        const m2 = m.add(tile, n).remove(tile, n);
        return m.count(tile) === m2.count(tile) && m.size() === m2.size();
      })
    );
  });

  it('from(m.toSortedArray()).size() === m.size() (property-based)', () => {
    fc.assert(
      fc.property(fc.array(tileIdArb, { minLength: 0, maxLength: 20 }), (tiles) => {
        const m = TileMultiset.from(tiles);
        const arr = m.toSortedArray();
        const m2 = TileMultiset.from(arr);
        return m.size() === m2.size();
      })
    );
  });

  it('toSortedArray produces a sorted array (property-based)', () => {
    fc.assert(
      fc.property(fc.array(tileIdArb, { minLength: 0, maxLength: 20 }), (tiles) => {
        const m = TileMultiset.from(tiles);
        const arr = m.toSortedArray();
        // Check that array is sorted
        for (let i = 0; i < arr.length - 1; i++) {
          if (compare(arr[i], arr[i + 1]) > 0) {
            return false;
          }
        }
        return true;
      })
    );
  });

  it('size() returns total count', () => {
    const m = new TileMultiset()
      .add({ kind: 'suit', suit: 'crak', rank: 1 }, 3)
      .add({ kind: 'wind', direction: 'north' }, 2);
    expect(m.size()).toBe(5);
  });

  it('count() returns 0 for absent tiles', () => {
    const m = new TileMultiset();
    expect(m.count({ kind: 'joker' })).toBe(0);
  });

  it('remove below 0 clamps to 0', () => {
    const m = new TileMultiset();
    const m2 = m.remove({ kind: 'joker' }, 5);
    expect(m2.count({ kind: 'joker' })).toBe(0);
  });
});

// ============================================================================
// Joker semantics tests
// ============================================================================

describe('isJoker', () => {
  it('returns true for joker tiles', () => {
    expect(isJoker({ kind: 'joker' })).toBe(true);
  });

  it('returns false for non-joker tiles (property-based)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ kind: fc.constant('suit' as const), suit: suitArb, rank: rankArb }),
          fc.record({ kind: fc.constant('wind' as const), direction: directionArb }),
          fc.record({ kind: fc.constant('dragon' as const), color: dragonColorArb }),
          fc.record({ kind: fc.constant('flower' as const), number: flowerNumberArb })
        ),
        (tile) => {
          return !isJoker(tile);
        }
      )
    );
  });
});

describe('canJokerSubstituteFor', () => {
  it('returns false for joker', () => {
    expect(canJokerSubstituteFor({ kind: 'joker' })).toBe(false);
  });

  it('returns true for all non-joker tiles (property-based)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ kind: fc.constant('suit' as const), suit: suitArb, rank: rankArb }),
          fc.record({ kind: fc.constant('wind' as const), direction: directionArb }),
          fc.record({ kind: fc.constant('dragon' as const), color: dragonColorArb }),
          fc.record({ kind: fc.constant('flower' as const), number: flowerNumberArb })
        ),
        (tile) => {
          return canJokerSubstituteFor(tile);
        }
      )
    );
  });
});

// ============================================================================
// Inventory tests
// ============================================================================

describe('totalTileCount', () => {
  it('computes correct total for practice ruleset', () => {
    const spec: InventorySpec = {
      suits: [
        { name: 'crak', count: 36 },
        { name: 'bam', count: 36 },
        { name: 'dot', count: 36 },
      ],
      dragons: [
        { color: 'red', count: 4 },
        { color: 'green', count: 4 },
        { color: 'white', count: 4 },
      ],
      winds: [
        { direction: 'north', count: 4 },
        { direction: 'east', count: 4 },
        { direction: 'south', count: 4 },
        { direction: 'west', count: 4 },
      ],
      flowers: { count: 8, distinguishable: true },
      jokers: { count: 8 },
    };

    expect(totalTileCount(spec)).toBe(152);
  });

  it('matches size of enumerated inventory', () => {
    const spec: InventorySpec = {
      suits: [
        { name: 'crak', count: 36 },
        { name: 'bam', count: 36 },
        { name: 'dot', count: 36 },
      ],
      dragons: [
        { color: 'red', count: 4 },
        { color: 'green', count: 4 },
        { color: 'white', count: 4 },
      ],
      winds: [
        { direction: 'north', count: 4 },
        { direction: 'east', count: 4 },
        { direction: 'south', count: 4 },
        { direction: 'west', count: 4 },
      ],
      flowers: { count: 8, distinguishable: true },
      jokers: { count: 8 },
    };

    const inventory = enumerateInventory(spec);
    expect(inventory.size()).toBe(totalTileCount(spec));
  });
});

describe('enumerateInventory', () => {
  it('creates correct number of suit tiles', () => {
    const spec: InventorySpec = {
      suits: [{ name: 'crak', count: 36 }],
      dragons: [],
      winds: [],
      flowers: { count: 0, distinguishable: true },
      jokers: { count: 0 },
    };

    const inventory = enumerateInventory(spec);
    expect(inventory.size()).toBe(36);

    // 4 of each rank 1-9
    for (let rank = 1; rank <= 9; rank++) {
      expect(inventory.count({ kind: 'suit', suit: 'crak', rank: rank as any })).toBe(4);
    }
  });

  it('creates distinguishable flowers split across 1-4', () => {
    const spec: InventorySpec = {
      suits: [],
      dragons: [],
      winds: [],
      flowers: { count: 8, distinguishable: true },
      jokers: { count: 0 },
    };

    const inventory = enumerateInventory(spec);
    expect(inventory.count({ kind: 'flower', number: 1 })).toBe(2);
    expect(inventory.count({ kind: 'flower', number: 2 })).toBe(2);
    expect(inventory.count({ kind: 'flower', number: 3 })).toBe(2);
    expect(inventory.count({ kind: 'flower', number: 4 })).toBe(2);
  });
});
