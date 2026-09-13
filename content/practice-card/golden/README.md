# Golden Target Sets

This directory contains hand-authored expected target sets for each practice hand.

## Purpose

Since `pattern-expander` (issue #4) doesn't exist yet, these golden files serve as:
1. **Exit-condition verification** for #2: proves the schema is expressive enough
2. **Test oracles** for #3: when the expander is built, it must reproduce these byte-for-byte

## Format

Each `hand-XX-name.json` file contains:

```json
{
  "hand_id": "hand-XX-name",
  "targets": [
    {
      "binding": {
        "VAR1": "value1",
        "VAR2": "value2"
      },
      "tiles": [
        /* 14-tile multiset as array of tile objects */
      ]
    }
  ]
}
```

- **`hand_id`**: Matches the hand's YAML `id` field
- **`targets`**: Array of all valid expansions
- **`binding`**: The variable assignments for this target (empty object for hands with no variables)
- **`tiles`**: Exactly 14 tile objects in the format matching the hand's group definitions

## Tile Object Format

```javascript
// Suited tiles
{ "suit": "crak|bam|dot", "rank": 1-9 }

// Dragons
{ "honor": "dragon", "color": "red|green|white" }

// Winds
{ "honor": "wind", "direction": "north|east|south|west" }

// Flowers
{ "flower": 1-4 }

// Jokers (when literal joker is required, rare)
{ "joker": true }
```

## Enumeration Rules

For hands with variables:
1. Enumerate all valid bindings satisfying the constraints
2. For each binding, instantiate the groups to get 14 concrete tiles
3. Duplicates (same multiset under different bindings) should be included only once
4. Order within `tiles` array doesn't matter (multiset, not sequence)

## Coverage

Not all hands have golden files yet. Priority:
- ✅ hand-03 (fixed tiles, no variables - simplest oracle)
- ✅ hand-07 (equal ranks - demonstrates variable binding enumeration)
- 🚧 Remaining hands: to be completed

Full enumeration for hands with large variable spaces (e.g., hand-01 with 3 suits × 7 consecutive rank triplets) may produce hundreds of targets - those can be sampled or scripted.
