# Mahjong Academy — Product and Implementation Design

**Version:** 0.1  
**Status:** Placeholder — full design doc to be added

## Overview

This document will contain the complete product design specification for Mahjong Academy.

## Module Layout

The project follows a modular architecture with clear package boundaries:

### Packages
- `tile-model/` — Tile identities, counts, serialization
- `card-schema/` — Schema and validation
- `pattern-expander/` — Abstract template → concrete targets
- `hand-evaluator/` — Matching, deficits, availability, ranking
- `rules-engine/` — Turns, Charleston, calls, Jokers, wins
- `bot-engine/` — Legal action generation and policies
- `lesson-engine/` — Curriculum and procedural exercises
- `explanation-engine/` — Fact records → localized templates
- `ui-components/` — Tiles, racks, target comparison

### Apps
- `web/` — Responsive PWA

### Content
- `practice-card/` — Original development card
- `lessons/` — Lesson manifests and strings

## Design Principles

- **No AI/LLM** — Everything must be deterministic (§2.1)
- **Card definitions are content** — Not app code (§2.5)
- **Property-based testing** — Required for correctness
- **Golden-scenario tests** — Required for regression prevention

---
*Full design specification to be added from founder's document*
