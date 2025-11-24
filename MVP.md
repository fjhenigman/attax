# Attax MVP (Minimum Viable Product)

## Overview

This document describes the Minimum Viable Product for Attax - a playable version of the game with core functionality only. The MVP focuses on delivering a functional game experience without advanced features like animations or rendering optimizations.

---

## MVP Scope

### Included Features

1. **7x7 Game Board** - Classic Ataxx board layout
2. **Two-Player Local Play** - Red vs Blue players taking turns
3. **Core Game Mechanics**
   - Clone moves (adjacent cells)
   - Jump moves (2 cells away)
   - Piece conversion on move
4. **Turn Management** - Automatic turn switching
5. **Win Detection** - Game ends when no moves available
6. **Score Display** - Show piece count for each player
7. **New Game** - Reset and start a new game

### Excluded from MVP

- Animations
- Rendering optimizations
- Sound effects
- Themes/skins
- AI opponent
- Network multiplayer
- Undo/redo
- Board size options
- Blocked cells/custom layouts

---

## Technical Implementation

### Target Platform

- **Device**: Touchscreen tabletop display
- **Input**: Click/tap only (no gestures)
- **Orientation**: Horizontal (tabletop mode)

### Technology Stack

- **Language**: TypeScript (vanilla)
- **Rendering**: HTML5 Canvas
- **State Management**: Redux
- **Bundler**: Vite
- **Unit Testing**: Vitest
- **E2E Testing**: Playwright

---

## State Structure

The MVP game state contains:

- **board**: 7x7 grid of cells (empty or piece with owner)
- **currentPlayer**: 'red' or 'blue'
- **selectedPiece**: Currently selected piece position or null
- **validMoves**: Array of valid move destinations
- **gameStatus**: 'playing' or 'finished'
- **winner**: 'red', 'blue', 'draw', or null
- **scores**: Piece counts for red and blue players

---

## User Interface

### Board Display

- Centered 7x7 grid on canvas
- Clear cell boundaries
- Distinct colors for Red and Blue pieces
- Highlight selected piece
- Show valid move destinations

### Controls

- Tap piece to select
- Tap valid destination to move
- Tap elsewhere to deselect
- "New Game" button

### Feedback

- Current player indicator
- Score display (piece counts)
- Winner announcement when game ends

---

## Core Game Logic

### Move Validation

Valid moves are all empty cells within 2 squares of the selected piece (horizontally, vertically, or diagonally).

### Move Types

- **Clone** (distance 1): Piece is duplicated to adjacent cell
- **Jump** (distance 2): Piece moves to destination, leaving original cell empty

### Piece Conversion

After each move, all opponent pieces adjacent to the destination cell are converted to the current player's color.

---

## Redux Actions (MVP)

- **SELECT_PIECE**: Select a piece to move
- **MAKE_MOVE**: Execute a move from one position to another
- **DESELECT_PIECE**: Cancel piece selection
- **NEW_GAME**: Start a new game

---

## Canvas Rendering (MVP)

Simple, functional rendering:

- Clear canvas with background color
- Draw grid lines
- Draw pieces as colored circles
- Highlight selected piece with yellow border
- Show valid moves with semi-transparent green overlay
- Display UI (scores, current player, winner)

---

## Input Handling (MVP)

- Listen for click and touch events on canvas
- Convert screen coordinates to board positions
- Dispatch appropriate Redux actions based on game state and clicked position

---

## File Structure (MVP)

```
src/
├── index.ts           # Entry point
├── types.ts           # Type definitions
├── store/
│   ├── index.ts       # Store setup
│   ├── reducer.ts     # Game reducer
│   └── actions.ts     # Action creators
├── game/
│   ├── board.ts       # Board utilities
│   └── moves.ts       # Move validation
├── renderer.ts        # Canvas rendering
└── input.ts           # Input handling
```

---

## Initial Board State

```
  0 1 2 3 4 5 6
0 R . . . . . B
1 . . . . . . .
2 . . . . . . .
3 . . . . . . .
4 . . . . . . .
5 . . . . . . .
6 B . . . . . R

R = Red piece
B = Blue piece
. = Empty cell
```

---

## Success Criteria

The MVP is complete when:

1. ✅ Game board renders on canvas
2. ✅ Players can tap to select their pieces
3. ✅ Valid moves are highlighted
4. ✅ Clone and jump moves work correctly
5. ✅ Adjacent opponent pieces are converted
6. ✅ Turns alternate between players
7. ✅ Game detects when no moves are available
8. ✅ Winner is announced (or draw)
9. ✅ New game can be started
10. ✅ Score (piece count) is displayed

---

## Next Steps (Post-MVP)

After the MVP is complete and stable, consider adding:

1. Move animations
2. Sound effects
3. Rendering optimizations
4. AI opponent
5. Custom board layouts
6. Undo/redo functionality
7. Multiple board sizes
