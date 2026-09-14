# Practice Card Content

Original development practice card will be defined here.

Card definitions are YAML/JSON content files, not code.

## Status

✅ Practice card defined with 10 hands covering pattern elements (singles, pairs, pungs, kongs, winds, dragons, flowers, jokers)

## Constraint Coverage Matrix

This table shows which hands exercise which constraint predicates from the closed vocabulary.

| Hand | Constraints Exercised |
|------|----------------------|
| hand-01 | `distinct`, `consecutive` (step=1) |
| hand-02 | `parity` (even), `distinct` |
| hand-03 | _(none - no variables)_ |
| hand-04 | `distinct`, `consecutive` (step=1), `offset` |
| hand-05 | `distinct`, `in_set` |
| hand-06 | `distinct`, `forbid_kind` |
| hand-07 | `distinct`, `equal` |
| hand-08 | `consecutive` (step=2) |
| hand-09 | _(none - no variables)_ |
| hand-10 | `distinct`, `parity` (odd), `offset` |

**Coverage:** All 7 constraint types (`distinct`, `equal`, `consecutive`, `parity`, `in_set`, `offset`, `forbid_kind`) are exercised by at least one hand.

## Golden Targets

Goldens provide expected target sets for the pattern-expander (#4). Each golden is hand-enumerated to match its corresponding hand YAML.

| Hand | Golden Status | Notes |
|------|---------------|-------|
| hand-03 | ✅ Complete | Single target (no variables) |
| hand-05 | ✅ Partial | Shows pattern: 3 ranks × 6 suit perms = 18 total |
| hand-07 | ✅ Partial | Shows pattern: 9 ranks × 6 suit perms = 54 total |
| hand-08 | ✅ Partial | Shows pattern: 3 starting ranks × 3 suits = 9 total |
| hand-01, hand-02, hand-04, hand-06, hand-09, hand-10 | ⏳ Deferred to #4 | Will be authored by pattern-expander engineer |
