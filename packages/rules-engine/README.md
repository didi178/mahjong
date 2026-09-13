# @mahjong/rules-engine

Game state reducer and rules enforcement.

## Purpose

Pure reducer: `(state, event) → (state', facts[])`

Handles:

- Turn sequence
- Charleston (tile passing)
- Calls (Pung, Kong, Chow)
- Joker rules
- Win detection

## Design Principles

- **Pure**: No side effects, no DOM, no timers
- **Deterministic**: Inject PRNG for any randomness
- **Fact-emitting**: All game events produce fact records

## Status

🚧 Package scaffolded - future implementation
