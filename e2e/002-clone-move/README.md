# Test 002: Clone Move

## Overview

This test validates the clone move mechanics in Attax. A clone move occurs when a piece moves 1 cell in any direction (including diagonals). Unlike a jump move, the original piece remains in place and a new piece is created at the destination.

## What This Test Validates

- Piece selection highlights the selected piece
- Valid moves are highlighted (cells within 1 cell distance)
- Clicking a valid adjacent cell creates a clone move
- After clone: original piece stays, new piece appears at destination
- Score updates correctly (player gains 1 piece)

## Test Scenario

1. Red selects piece at position (0,0) - top-left corner
2. Valid moves are highlighted (adjacent empty cells)
3. Red clicks on position (1,0) to clone one cell down
4. Piece is duplicated - original stays at (0,0), new piece at (1,0)
5. Score updates: Red 3, Blue 2

## Significant Moments

### 0000 - Before Move

Initial game state before any move is made.

![Before any move](clone.spec.ts-snapshots/0000-before-move-chromium-linux.png)

**Expected State:**
- Standard initial board setup
- Red: 2, Blue: 2
- RED's Turn

### 0001 - Piece Selected

Red player has selected the piece at (0,0). Valid moves are highlighted.

![Piece selected with valid moves](clone.spec.ts-snapshots/0001-piece-selected-chromium-linux.png)

**Expected State:**
- Yellow highlight around selected piece at (0,0)
- Green highlights showing valid move destinations
- All cells within 2 squares that are empty are valid

### 0002 - After Clone

After the clone move to (1,0). The original piece remains and a new piece appears.

![After clone move](clone.spec.ts-snapshots/0002-after-clone-chromium-linux.png)

**Expected State:**
- Red piece at (0,0) - original piece
- Red piece at (1,0) - new cloned piece
- Score: Red 3, Blue 2
- BLUE's Turn (turn switched to opponent)

## Running This Test

```bash
npx playwright test e2e/002-clone-move
```

To update screenshots:
```bash
npx playwright test e2e/002-clone-move --update-snapshots
```
