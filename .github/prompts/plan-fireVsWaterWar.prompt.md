# 🔥💧 Tic-Tac-Toe Twist Modes — Game Design Plan

## Overview

Add a **mode selector** to the intro screen so players choose which twist variant they want to play. The current "Vanishing Moves" becomes one option alongside new twist modes.

---

## Mode Selection (Intro Screen)

When the player starts, they pick a twist:

```
┌─────────────────────────────────────────────┐
│          Choose Your Twist                   │
│                                              │
│  ♻️  Vanishing Moves        (current game)   │
│      Oldest piece disappears                 │
│                                              │
│  🔥  Fire vs Water War       (new)           │
│      Elemental battle with surround kills    │
│                                              │
│  ⚡  Chain Reaction           (new, optional)│
│      Pieces explode neighbors on capture     │
└─────────────────────────────────────────────┘
```

After selecting a twist → choose opponent (AI / Friend) → choose difficulty → play.

---

## Twist 1: ♻️ Vanishing Moves (Current)

Already implemented. No changes needed.

- Max 3 pieces per player
- 4th piece removes oldest
- Standard 3-in-a-row win

---

## Twist 2: 🔥💧 Fire vs Water War

### Theme

- Player 1 = 💧 Water
- Player 2 / AI = 🔥 Fire
- Board has special terrain squares

### Rules

#### Core Rules (same as Vanishing Moves)
- 3×3 board
- 3 pieces max per player — 4th removes oldest
- 3 in a row wins

#### New Rule 1: Surround Kill
If a piece is **sandwiched between two enemy pieces** on a line (row, column, or diagonal), it is **immediately removed**.

```
Surround patterns (examples):

Row:      🔥 💧 🔥  →  💧 is removed
Column:   💧        Diagonal:  💧
          🔥                    🔥
          💧                     💧
          → 🔥 removed           → 🔥 removed
```

**Precise definition:**
For each WIN_LINE [a, b, c]:
- If board[a] and board[c] are the SAME player, and board[b] is the OTHER player → board[b] is removed
- If board[a] and board[b] are the SAME player, and board[c] is isolated and surrounded differently → no removal (only middle position counts)

**Important:** Surround checks happen **immediately after every move**, including after vanish.

#### New Rule 2: Special Squares (Terrain)

Two cells are randomly assigned as special terrain at game start:

| Terrain | Symbol | Effect |
|---------|--------|--------|
| 🌋 Volcano | Cell marked with lava border | 🔥 Fire placed here **cannot be removed** by surround rule |
| 🌊 Ocean | Cell marked with wave border | 💧 Water placed here **cannot be removed** by surround rule |

**Terrain placement rules:**
- 1 Volcano + 1 Ocean per game
- Never on center (cell 4) — too powerful
- Randomized from corners and edges each game
- Visual: subtle background glow (orange for volcano, blue for ocean)

#### New Rule 3: Elimination Win
In addition to 3-in-a-row, you also win by **eliminating all enemy pieces** from the board via surround kills.

### Win Conditions (Fire vs Water)
1. ✅ Get 3 in a row (standard)
2. ✅ Eliminate all enemy pieces via surround kills
3. ❌ No draw — game continues until someone wins (pieces cycle via vanish rule)

### Turn Flow

```
1. Player places 💧 on empty cell
2. Check vanish rule (if 4th piece → remove oldest)
3. Check surround kills (scan all lines for sandwich patterns)
4. Remove any surrounded pieces
5. Check win conditions (3-in-a-row OR elimination)
6. AI places 🔥
7. Repeat steps 2-5
8. Loop until winner
```

### AI Strategy (Fire vs Water)

The AI needs a modified evaluation function:

```
Scoring priorities:
1. Win by 3-in-a-row           → +1000
2. Win by elimination           → +900
3. Surround kill opportunity    → +200 per kill
4. Protect volcano squares      → +50
5. Prevent opponent's 3-in-row  → +150
6. Block opponent surround kill → +100
7. Standard positional scoring  → existing heuristic
```

### Visual Design

| Element | Visual |
|---------|--------|
| 💧 Water piece | Blue circle with water ripple animation |
| 🔥 Fire piece | Orange/red X with flame flicker animation |
| 🌋 Volcano cell | Warm orange-ish background, subtle glow border |
| 🌊 Ocean cell | Cool blue-ish background, wave-like border |
| Surround kill | Piece explodes with particle effect, then fades |
| Protected piece | Shield icon overlay on volcano/ocean |

### Intro Explanation Steps (Fire vs Water)

```
Step 1: "Choose your element" — Water vs Fire theme intro
Step 2: "3 pieces max" — same as current rule
Step 3: "Surround to kill" — animated demo of sandwich removal
Step 4: "Special terrain" — show volcano protects fire, ocean protects water
Step 5: "Two ways to win" — 3-in-a-row OR eliminate all enemies
Step 6: Ready screen — choose difficulty
```

---

## Twist 3: ⚡ Chain Reaction (Optional — Bonus Twist)

A third twist idea that could add even more variety:

### Concept
When you complete a 2-in-a-row, your pieces become **charged**. If an opponent places next to a charged pair, both charged pieces "explode" — removing the opponent's piece AND your two charged pieces.

### Rules
- Standard 3-piece max + vanish
- **Charged state:** When you have exactly 2 pieces in a line with the 3rd cell empty, both pieces glow (charged)
- **Chain explosion:** If opponent places adjacent to a charged pair (not completing a block, just adjacent), explosion triggers
- **Explosion:** Removes the opponent's new piece + your 2 charged pieces (3 pieces removed total)
- **Win:** 3-in-a-row only (no elimination win)

### Why This Is Interesting
- Forces players to be careful WHERE they block
- Creates risk/reward: having 2-in-a-row is powerful but dangerous
- Adds a timing element: do you complete 3-in-a-row before opponent triggers explosion?

---

## Implementation Plan

### Phase 1: Architecture (shared)
1. Create `src/utils/twistConfig.js` — defines each twist's rules, win conditions, special mechanics
2. Add `twistMode` state to App.jsx (`'vanish'` | `'firewater'` | `'chain'`)
3. Update IntroScreen with twist selector step
4. Create `src/utils/fireWaterUtils.js` — surround check, terrain generation, elimination check
5. Create `src/utils/chainReactionUtils.js` (if building twist 3)

### Phase 2: Fire vs Water
1. Modify `gameUtils.js` — add `checkSurroundKills(board, lastMove)` function
2. Modify `gameUtils.js` — add `checkEliminationWin(board)` function
3. Add terrain generation — `generateTerrain()` returns `{ volcano: cellIndex, ocean: cellIndex }`
4. Modify `Board.jsx` — render terrain backgrounds on special cells
5. Modify `Cell.jsx` — fire/water themed pieces, protection shield
6. Modify AI (`aiUtils.js`) — add surround-aware evaluation + elimination scoring
7. Add surround kill animation (CSS keyframes)
8. Add terrain indicators (CSS for volcano/ocean cells)
9. Update `App.jsx` turn flow — insert surround check after each move

### Phase 3: Intro & Polish
1. Add Fire vs Water intro steps with animated demos
2. Add twist-specific Coach hints
3. Add sound effects placeholder (optional)
4. Test all edge cases (surround + vanish interaction, protected pieces)

### Phase 4: Chain Reaction (optional)
1. Implement charge detection
2. Implement explosion mechanic
3. AI evaluation for charged states
4. Visual effects for charged/exploding pieces

---

## File Structure (Proposed)

```
src/
  utils/
    gameUtils.js          ← shared: board, win check, vanish
    aiUtils.js            ← shared: minimax, AI move, coach
    fireWaterUtils.js     ← NEW: surround, terrain, elimination
    chainReactionUtils.js ← NEW (optional): charge, explosion
    twistConfig.js        ← NEW: twist definitions & rules
  components/
    IntroScreen.jsx       ← add twist selector step
    Board.jsx             ← add terrain rendering, themed pieces
    Cell.jsx              ← add fire/water visuals, protection
    GameHeader.jsx        ← show current twist name
    SurroundEffect.jsx    ← NEW: kill animation overlay
    TerrainIndicator.jsx  ← NEW: volcano/ocean cell decoration
```

---

## Edge Cases to Handle

| Scenario | Resolution |
|----------|------------|
| Surround kill + vanish happen same turn | Vanish first, then check surrounds |
| Surround removes piece on volcano/ocean | Protected — no removal |
| Surround creates 3-in-a-row for killer | Check win AFTER all removals resolve |
| Both players eliminated simultaneously | Player who moved wins (active turn advantage) |
| All pieces removed, no winner | Not possible — vanish refills before surround |
| Chain: explosion removes a piece that was part of another surround | Resolve sequentially left-to-right, top-to-bottom |

---

## Open Questions

1. Should terrain positions be fixed or random each game?
2. Should the Coach work in Fire vs Water mode? (Probably yes but needs surround-aware logic)
3. Should Fire vs Water have its own separate scoreboard?
4. Should twist mode be saved in localStorage?
5. Should we add a "Classic" mode (no twist at all) as baseline?
6. How many difficulty levels for Fire vs Water AI?
