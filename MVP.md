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

```typescript
interface GameState {
  board: Cell[][];           // 7x7 grid
  currentPlayer: 'red' | 'blue';
  selectedPiece: Position | null;
  validMoves: Position[];
  gameStatus: 'playing' | 'finished';
  winner: 'red' | 'blue' | 'draw' | null;
  scores: {
    red: number;
    blue: number;
  };
}

interface Cell {
  type: 'empty' | 'piece';
  owner?: 'red' | 'blue';
}

interface Position {
  row: number;
  col: number;
}
```

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

```typescript
function getValidMoves(board: Cell[][], position: Position): Position[] {
  const moves: Position[] = [];
  const { row, col } = position;
  
  // Check all cells within 2 squares
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      if (dr === 0 && dc === 0) continue;
      
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (isValidPosition(newRow, newCol) && 
          board[newRow][newCol].type === 'empty') {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }
  
  return moves;
}
```

### Move Types

```typescript
function getMoveType(from: Position, to: Position): 'clone' | 'jump' {
  const distance = Math.max(
    Math.abs(to.row - from.row),
    Math.abs(to.col - from.col)
  );
  return distance === 1 ? 'clone' : 'jump';
}
```

### Piece Conversion

```typescript
function getConvertedPieces(
  board: Cell[][], 
  position: Position, 
  player: 'red' | 'blue'
): Position[] {
  const converted: Position[] = [];
  const { row, col } = position;
  
  // Check all 8 adjacent cells
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      
      const adjRow = row + dr;
      const adjCol = col + dc;
      
      if (isValidPosition(adjRow, adjCol)) {
        const cell = board[adjRow][adjCol];
        if (cell.type === 'piece' && cell.owner !== player) {
          converted.push({ row: adjRow, col: adjCol });
        }
      }
    }
  }
  
  return converted;
}
```

---

## Redux Actions (MVP)

```typescript
// Select a piece
{ type: 'SELECT_PIECE', payload: Position }

// Make a move
{ type: 'MAKE_MOVE', payload: { from: Position, to: Position } }

// Deselect current piece  
{ type: 'DESELECT_PIECE' }

// Start new game
{ type: 'NEW_GAME' }
```

---

## Canvas Rendering (MVP)

Simple, functional rendering without optimizations:

```typescript
class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  private width: number;
  private height: number;
  
  render(state: GameState): void {
    this.clear();
    this.drawGrid();
    this.drawPieces(state.board);
    this.drawSelection(state.selectedPiece);
    this.drawValidMoves(state.validMoves);
    this.drawUI(state);
  }
  
  private clear(): void {
    this.ctx.fillStyle = '#2D3748';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  
  private drawGrid(): void {
    this.ctx.strokeStyle = '#4A5568';
    this.ctx.lineWidth = 2;
    
    for (let i = 0; i <= 7; i++) {
      // Vertical lines
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.cellSize, 0);
      this.ctx.lineTo(i * this.cellSize, 7 * this.cellSize);
      this.ctx.stroke();
      
      // Horizontal lines
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.cellSize);
      this.ctx.lineTo(7 * this.cellSize, i * this.cellSize);
      this.ctx.stroke();
    }
  }
  
  private drawPieces(board: Cell[][]): void {
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        const cell = board[row][col];
        if (cell.type === 'piece' && cell.owner) {
          this.drawPiece(row, col, cell.owner);
        }
      }
    }
  }
  
  private drawPiece(row: number, col: number, owner: 'red' | 'blue'): void {
    const x = col * this.cellSize + this.cellSize / 2;
    const y = row * this.cellSize + this.cellSize / 2;
    const radius = this.cellSize * 0.4;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = owner === 'red' ? '#E53E3E' : '#3182CE';
    this.ctx.fill();
  }
}
```

---

## Input Handling (MVP)

```typescript
class InputHandler {
  private store: Store<GameState>;
  
  constructor(canvas: HTMLCanvasElement, store: Store<GameState>) {
    this.store = store;
    canvas.addEventListener('click', (e) => this.handleClick(e));
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleTouch(e);
    });
  }
  
  private handleClick(event: MouseEvent): void {
    const position = this.getPosition(event.clientX, event.clientY);
    this.processInput(position);
  }
  
  private handleTouch(event: TouchEvent): void {
    const touch = event.touches[0];
    const position = this.getPosition(touch.clientX, touch.clientY);
    this.processInput(position);
  }
  
  private processInput(position: Position): void {
    const state = this.store.getState();
    
    // Validate position bounds
    if (!this.isValidPosition(position)) return;
    
    const cell = state.board[position.row][position.col];
    
    if (state.selectedPiece) {
      // Try to make a move
      const isValidMove = state.validMoves.some(
        m => m.row === position.row && m.col === position.col
      );
      
      if (isValidMove) {
        this.store.dispatch({ 
          type: 'MAKE_MOVE', 
          payload: { from: state.selectedPiece, to: position } 
        });
      } else {
        this.store.dispatch({ type: 'DESELECT_PIECE' });
      }
    } else if (cell.type === 'piece' && cell.owner === state.currentPlayer) {
      this.store.dispatch({ type: 'SELECT_PIECE', payload: position });
    }
  }
  
  private isValidPosition(position: Position): boolean {
    return position.row >= 0 && position.row < 7 &&
           position.col >= 0 && position.col < 7;
  }
}
```

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
