# Test 001: Initial Setup

## Overview

This test validates the initial game state and rendering when the Attax game loads. It ensures that the game board is properly set up with the correct starting positions and that the UI displays the correct initial state.

## What This Test Validates

- Initial 7x7 game board is rendered correctly
- Starting piece positions are correct:
  - Red pieces: top-left (0,0) and bottom-right (6,6)
  - Blue pieces: top-right (0,6) and bottom-left (6,0)
- Initial scores display correctly (Red: 2, Blue: 2)
- Red player starts first (turn indicator shows "RED's Turn")

## Significant Moments

### 0000 - Initial Board

The game board immediately after loading. Shows the 7x7 grid with starting piece positions.

![Initial board setup](initial.spec.ts-snapshots/0000-initial-board-chromium-linux.png)

**Expected State:**
- 7x7 grid visible
- Red piece at top-left corner (0,0)
- Red piece at bottom-right corner (6,6)
- Blue piece at top-right corner (0,6)
- Blue piece at bottom-left corner (6,0)

### 0001 - Red Player Turn

Shows the turn indicator displaying that it's Red's turn to play.

![Red player turn indicator](initial.spec.ts-snapshots/0001-red-player-turn-chromium-linux.png)

**Expected State:**
- Turn indicator shows "RED's Turn" (in red color)
- Red player is the starting player in Attax

### 0002 - Initial Scores

Shows the score display with both players at 2 pieces each.

![Initial scores display](initial.spec.ts-snapshots/0002-initial-scores-chromium-linux.png)

**Expected State:**
- Red: 2 displayed on the left
- Blue: 2 displayed on the right
- Both scores are accurate for the starting position

## Running This Test

```bash
npx playwright test e2e/001-initial-setup
```

To update screenshots:
```bash
npx playwright test e2e/001-initial-setup --update-snapshots
```
