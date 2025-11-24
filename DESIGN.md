# Attax Design Document

## Overview

This document outlines the technical design for **Attax**, a web-based implementation of the classic Ataxx board game. The game is designed for **touchscreen tabletop displays** where multiple players can gather around and interact simultaneously through tap/click-based controls.

---

## Target Platform

### Primary Device: Touchscreen Tabletop

The game is optimized for large touchscreen tabletop displays (e.g., Microsoft Surface Hub, Samsung Flip, or custom tabletop installations).

**Key Characteristics:**
- **Screen Size**: 40"+ diagonal displays
- **Orientation**: Horizontal (tabletop mode)
- **Multi-user**: Players stand/sit around all sides of the table
- **Input**: Multi-touch capacitive touchscreen
- **Resolution**: 1920x1080 minimum, scales up to 4K

### Design Considerations for Tabletop Play

1. **360° Viewing**: UI elements and game board must be readable from all sides
2. **Reach Zones**: Interactive elements positioned within comfortable reach from table edges
3. **Large Touch Targets**: Minimum 48x48px touch targets for reliable tap detection
4. **No Hover States**: All interactions must work with tap only (no hover)
5. **Multi-Player Proximity**: Visual feedback must be visible to players on opposite sides

---

## User Interaction Model

### Click/Tap-Based Interactions Only

All game interactions are designed for touch input without requiring gestures like pinch, swipe, or drag.

#### Primary Interactions

| Action | Interaction | Visual Feedback |
|--------|-------------|-----------------|
| Select piece | Single tap on own piece | Piece highlights, valid moves shown |
| Cancel selection | Tap empty area or tap selected piece again | Highlight removed |
| Make clone move | Tap adjacent empty cell | Animation shows piece cloning |
| Make jump move | Tap empty cell 2 spaces away | Animation shows piece jumping |
| Start new game | Tap "New Game" button | Game resets with animation |
| Pass turn | Tap "Pass" button (when no moves available) | Turn indicator changes |

#### Touch Feedback

- **Immediate Visual Response**: All taps provide instant visual acknowledgment (< 16ms)
- **Ripple Effect**: Touch point shows brief ripple animation
- **Sound Feedback**: Optional audio cues for selections and moves (configurable)

---

## Rendering Architecture

### Canvas-Based Rendering with Vanilla TypeScript

The game uses the HTML5 Canvas API for all rendering, implemented in vanilla TypeScript without external rendering libraries.

#### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Window                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │              HTML5 Canvas Element                  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │              Render Layers                   │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │  Layer 1: Background & Grid           │  │  │  │
│  │  │  ├───────────────────────────────────────┤  │  │  │
│  │  │  │  Layer 2: Board Cells & Blockers      │  │  │  │
│  │  │  ├───────────────────────────────────────┤  │  │  │
│  │  │  │  Layer 3: Game Pieces                 │  │  │  │
│  │  │  ├───────────────────────────────────────┤  │  │  │
│  │  │  │  Layer 4: Selection & Move Hints      │  │  │  │
│  │  │  ├───────────────────────────────────────┤  │  │  │
│  │  │  │  Layer 5: Animations                  │  │  │  │
│  │  │  ├───────────────────────────────────────┤  │  │  │
│  │  │  │  Layer 6: UI Overlay                  │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Rendering Components

##### 1. GameRenderer (Main Class)

```typescript
class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private layers: RenderLayer[];
  
  constructor(canvas: HTMLCanvasElement) { }
  
  public render(state: GameState): void { }
  public resize(width: number, height: number): void { }
  private clear(): void { }
  private renderLayers(): void { }
}
```

##### 2. Render Layers

Each layer is responsible for rendering a specific aspect of the game:

- **BackgroundLayer**: Solid color or gradient background
- **GridLayer**: Board grid lines and cell boundaries
- **CellLayer**: Empty cells, blocked cells, and cell states
- **PieceLayer**: Player pieces with colors and styling
- **HighlightLayer**: Selection highlights and valid move indicators
- **AnimationLayer**: Move animations, conversions, and effects
- **UILayer**: Score display, turn indicator, buttons

##### 3. Animation System

```typescript
interface Animation {
  type: 'clone' | 'jump' | 'convert' | 'ripple';
  startTime: number;
  duration: number;
  from: Position;
  to?: Position;
  progress: number;
}

class AnimationManager {
  private animations: Animation[];
  
  public add(animation: Animation): void { }
  public update(currentTime: number): void { }
  public render(ctx: CanvasRenderingContext2D): void { }
  public isAnimating(): boolean { }
}
```

#### Rendering Pipeline

1. **State Change Detection**: Compare current state with previous state
2. **Dirty Region Calculation**: Identify areas that need redrawing
3. **Layer Rendering**: Render each layer in order (back to front)
4. **Animation Frame**: Update and render active animations
5. **Composite**: Final canvas composition and display

#### Performance Optimizations

- **RequestAnimationFrame**: Synchronized with display refresh rate
- **Dirty Rectangle Rendering**: Only redraw changed regions
- **Object Pooling**: Reuse animation and rendering objects
- **Off-screen Canvases**: Pre-render static elements (grid, background)
- **Resolution Scaling**: Adapt to device pixel ratio for crisp rendering

---

## State Management with Redux

### Store Architecture

Redux manages all game state, providing predictable state updates and enabling features like undo/redo.

#### State Shape

```typescript
interface RootState {
  game: GameState;
  ui: UIState;
  settings: SettingsState;
}

interface GameState {
  board: Board;
  currentPlayer: Player;
  selectedPiece: Position | null;
  validMoves: Move[];
  moveHistory: Move[];
  gameStatus: 'playing' | 'finished' | 'paused';
  winner: Player | 'draw' | null;
  scores: {
    [Player.Red]: number;
    [Player.Blue]: number;
  };
}

interface Board {
  cells: Cell[][];
  size: number;
}

interface Cell {
  type: 'empty' | 'blocked' | 'piece';
  owner?: Player;
}

enum Player {
  Red = 'red',
  Blue = 'blue'
}

interface Position {
  row: number;
  col: number;
}

interface Move {
  type: 'clone' | 'jump';
  from: Position;
  to: Position;
  player: Player;
  conversions: Position[];
  timestamp: number;
}

interface UIState {
  isAnimating: boolean;
  showMoveHints: boolean;
  touchFeedback: Position | null;
  menuOpen: boolean;
}

interface SettingsState {
  soundEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  theme: 'classic' | 'modern' | 'high-contrast';
  boardSize: 7 | 9 | 11;
}
```

### Actions

```typescript
// Game Actions
const SELECT_PIECE = 'game/SELECT_PIECE';
const DESELECT_PIECE = 'game/DESELECT_PIECE';
const MAKE_MOVE = 'game/MAKE_MOVE';
const NEW_GAME = 'game/NEW_GAME';
const UNDO_MOVE = 'game/UNDO_MOVE';
const REDO_MOVE = 'game/REDO_MOVE';

// UI Actions
const SET_ANIMATING = 'ui/SET_ANIMATING';
const SET_TOUCH_FEEDBACK = 'ui/SET_TOUCH_FEEDBACK';
const TOGGLE_MENU = 'ui/TOGGLE_MENU';

// Settings Actions
const UPDATE_SETTINGS = 'settings/UPDATE_SETTINGS';
```

### Action Creators

```typescript
// Game action creators
const selectPiece = (position: Position) => ({
  type: SELECT_PIECE,
  payload: position
});

const makeMove = (from: Position, to: Position) => ({
  type: MAKE_MOVE,
  payload: { from, to }
});

const newGame = (boardSize?: number) => ({
  type: NEW_GAME,
  payload: { boardSize }
});

// UI action creators
const setAnimating = (isAnimating: boolean) => ({
  type: SET_ANIMATING,
  payload: isAnimating
});

const setTouchFeedback = (position: Position | null) => ({
  type: SET_TOUCH_FEEDBACK,
  payload: position
});
```

### Reducers

```typescript
// Game Reducer
function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case SELECT_PIECE:
      return handleSelectPiece(state, action.payload);
    case MAKE_MOVE:
      return handleMakeMove(state, action.payload);
    case NEW_GAME:
      return createInitialGameState(action.payload.boardSize);
    case UNDO_MOVE:
      return handleUndo(state);
    default:
      return state;
  }
}

// Root Reducer
const rootReducer = combineReducers({
  game: gameReducer,
  ui: uiReducer,
  settings: settingsReducer
});
```

### Middleware

```typescript
// Logging Middleware (Development)
const loggerMiddleware = (store) => (next) => (action) => {
  console.log('Dispatching:', action);
  const result = next(action);
  console.log('Next State:', store.getState());
  return result;
};

// Animation Middleware
const animationMiddleware = (store) => (next) => (action) => {
  if (action.type === MAKE_MOVE) {
    store.dispatch(setAnimating(true));
  }
  return next(action);
};
```

### Store Configuration

```typescript
import { createStore, applyMiddleware, compose } from 'redux';

const store = createStore(
  rootReducer,
  preloadedState,
  compose(
    applyMiddleware(
      loggerMiddleware,
      animationMiddleware
    )
  )
);
```

### Redux Integration with Canvas Rendering

```typescript
class Game {
  private store: Store<RootState>;
  private renderer: GameRenderer;
  private previousState: RootState | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.store = createStore(rootReducer);
    this.renderer = new GameRenderer(canvas);
    
    // Subscribe to state changes
    this.store.subscribe(() => {
      const currentState = this.store.getState();
      if (this.shouldRender(currentState)) {
        this.renderer.render(currentState.game);
      }
      this.previousState = currentState;
    });
  }
  
  private shouldRender(state: RootState): boolean {
    if (!this.previousState) return true;
    return state.game !== this.previousState.game ||
           state.ui !== this.previousState.ui;
  }
}
```

---

## Application Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────┐
│                      Application                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │                   Game Controller                    ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ ││
│  │  │   Input     │  │   Redux     │  │  Renderer   │ ││
│  │  │  Handler    │──│   Store     │──│             │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘ ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │                  Game Logic                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ ││
│  │  │   Move      │  │   Board     │  │    Win      │ ││
│  │  │  Validator  │  │   Manager   │  │  Checker    │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘ ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── index.ts                 # Application entry point
├── types/
│   ├── index.ts            # Type exports
│   ├── game.ts             # Game-related types
│   ├── ui.ts               # UI-related types
│   └── settings.ts         # Settings types
├── store/
│   ├── index.ts            # Store configuration
│   ├── rootReducer.ts      # Combined reducer
│   ├── actions/
│   │   ├── gameActions.ts  # Game action creators
│   │   ├── uiActions.ts    # UI action creators
│   │   └── settingsActions.ts
│   ├── reducers/
│   │   ├── gameReducer.ts  # Game state reducer
│   │   ├── uiReducer.ts    # UI state reducer
│   │   └── settingsReducer.ts
│   └── middleware/
│       ├── logger.ts       # Development logging
│       └── animation.ts    # Animation coordination
├── game/
│   ├── Game.ts             # Main game controller
│   ├── Board.ts            # Board logic
│   ├── MoveValidator.ts    # Move validation
│   └── WinChecker.ts       # Win condition checking
├── renderer/
│   ├── GameRenderer.ts     # Main renderer
│   ├── layers/
│   │   ├── BackgroundLayer.ts
│   │   ├── GridLayer.ts
│   │   ├── PieceLayer.ts
│   │   ├── HighlightLayer.ts
│   │   └── UILayer.ts
│   ├── AnimationManager.ts # Animation handling
│   └── themes/
│       ├── classic.ts      # Classic theme colors
│       ├── modern.ts       # Modern theme colors
│       └── high-contrast.ts
├── input/
│   ├── InputHandler.ts     # Touch/click event handling
│   └── HitTest.ts          # Canvas coordinate mapping
└── utils/
    ├── geometry.ts         # Position calculations
    ├── colors.ts           # Color utilities
    └── audio.ts            # Sound effects (optional)
```

### Input Handling

```typescript
class InputHandler {
  private canvas: HTMLCanvasElement;
  private store: Store<RootState>;
  
  constructor(canvas: HTMLCanvasElement, store: Store<RootState>) {
    this.canvas = canvas;
    this.store = store;
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Touch events for mobile/tablet
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // Click events for mouse input
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    
    // Prevent context menu on long press
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  private handleTouch(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    const position = this.getCanvasPosition(touch.clientX, touch.clientY);
    this.processInput(position);
  }
  
  private handleClick(event: MouseEvent): void {
    const position = this.getCanvasPosition(event.clientX, event.clientY);
    this.processInput(position);
  }
  
  private getCanvasPosition(clientX: number, clientY: number): Position {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return this.pixelToBoardPosition(x, y);
  }
  
  private processInput(position: Position): void {
    const state = this.store.getState();
    
    // Don't process input during animations
    if (state.ui.isAnimating) return;
    
    const cell = state.game.board.cells[position.row]?.[position.col];
    if (!cell) return;
    
    if (state.game.selectedPiece) {
      // A piece is already selected - try to make a move
      this.handleMoveAttempt(position);
    } else if (cell.type === 'piece' && cell.owner === state.game.currentPlayer) {
      // Select this piece
      this.store.dispatch(selectPiece(position));
    }
  }
  
  private handleMoveAttempt(position: Position): void {
    const state = this.store.getState();
    const validMove = state.game.validMoves.find(
      m => m.to.row === position.row && m.to.col === position.col
    );
    
    if (validMove) {
      this.store.dispatch(makeMove(state.game.selectedPiece!, position));
    } else {
      // Invalid move - deselect
      this.store.dispatch(deselectPiece());
    }
  }
}
```

---

## Visual Design

### Board Layout for Tabletop

The board is centered on the display with equal spacing on all sides, allowing players around the table to view and interact comfortably.

```
┌─────────────────────────────────────────────────────────┐
│                    Player 2 Area                         │
│                   (Score Display)                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │     ┌─────────────────────────────────────┐      │  │
│  │     │                                     │      │  │
│  │     │                                     │      │  │
│P │     │                                     │      │ P│
│l │     │           7x7 Game Board            │      │ l│
│a │     │                                     │      │ a│
│y │     │                                     │      │ y│
│e │     │                                     │      │ e│
│r │     │                                     │      │ r│
│  │     │                                     │      │  │
│1 │     │                                     │      │ 2│
│  │     └─────────────────────────────────────┘      │  │
│A │                                                   │ A│
│r │                                                   │ r│
│e │                                                   │ e│
│a │                                                   │ a│
│  └───────────────────────────────────────────────────┘  │
│                    Player 1 Area                         │
│               (Score Display, Controls)                  │
└─────────────────────────────────────────────────────────┘
```

### Color Scheme

#### Classic Theme
- **Background**: #2D3748 (Dark gray-blue)
- **Grid Lines**: #4A5568 (Medium gray)
- **Empty Cells**: #1A202C (Very dark)
- **Blocked Cells**: #718096 (Gray)
- **Player Red**: #E53E3E (Bright red)
- **Player Blue**: #3182CE (Bright blue)
- **Selection Highlight**: #F6E05E (Yellow glow)
- **Valid Move Hint**: rgba(72, 187, 120, 0.5) (Semi-transparent green)

### Accessibility

- **High Contrast Mode**: Enhanced colors for visibility
- **Color Blind Support**: Patterns/shapes in addition to colors
- **Large Touch Targets**: Minimum 48x48px interactive areas
- **Clear Visual Feedback**: Animations and highlights for all actions

---

## Build & Development

### Technology Stack

- **Language**: TypeScript (vanilla, no frameworks)
- **Bundler**: Vite
- **State Management**: Redux
- **Unit Testing**: Vitest
- **E2E Testing**: Playwright
- **Linting**: ESLint with TypeScript rules

### Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext .ts"
  }
}
```

### Dependencies

```json
{
  "dependencies": {
    "redux": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "vitest": "^2.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

---

## Future Considerations

### Potential Enhancements

1. **AI Opponent**: Single-player mode with configurable difficulty
2. **Network Multiplayer**: Play against remote opponents
3. **Board Editor**: Create custom board layouts with blockers
4. **Tournament Mode**: Support for competitive play
5. **Replay System**: Save and review past games
6. **Accessibility**: Keyboard navigation

### Scalability

- State structure supports larger board sizes (9x9, 11x11)
- Rendering pipeline can accommodate additional visual effects
- Redux middleware system allows for easy feature additions

---

## Summary

This design document outlines a touchscreen-optimized implementation of Attax using:

- **Canvas Rendering**: Efficient, layer-based rendering with vanilla TypeScript
- **Redux State Management**: Predictable state updates with middleware support
- **Touch-First Design**: All interactions designed for tap/click input
- **Tabletop Optimization**: 360° viewable interface for multi-player gatherings

The architecture prioritizes simplicity, performance, and maintainability while providing a solid foundation for future enhancements.
