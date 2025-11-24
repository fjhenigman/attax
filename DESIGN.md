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

Responsible for managing the canvas context, coordinating render layers, and handling resize events.

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

Manages animations for clone moves, jump moves, piece conversions, and touch feedback ripples.

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

Redux manages all game state, providing predictable state updates. The architecture enables future features like undo/redo through its immutable state model.

#### State Shape

The state is organized into three main slices:

- **game**: Board state, current player, selected piece, valid moves, game status, winner, and scores
- **ui**: Animation state, move hints visibility, touch feedback position, menu state
- **settings**: Sound preferences, animation speed, theme selection, board size

#### Actions

The following action types are supported:

**Game Actions:**
- SELECT_PIECE: Select a piece to move
- DESELECT_PIECE: Cancel piece selection
- MAKE_MOVE: Execute a move from one position to another
- NEW_GAME: Start a new game
- UNDO_MOVE: Undo the last move
- REDO_MOVE: Redo a previously undone move

**UI Actions:**
- SET_ANIMATING: Toggle animation state
- SET_TOUCH_FEEDBACK: Set touch feedback position
- TOGGLE_MENU: Toggle menu visibility

**Settings Actions:**
- UPDATE_SETTINGS: Update game settings

### Middleware

- **Logger Middleware**: Development-only logging for debugging
- **Animation Middleware**: Coordinates animations when moves are made

### Redux Integration with Canvas Rendering

The Game class subscribes to Redux store changes and triggers re-renders when game or UI state changes.

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

The source code is organized into the following directories:

- **src/**: Application entry point and main types
- **src/store/**: Redux store configuration, actions, reducers, and middleware
- **src/game/**: Game logic including board management, move validation, and win checking
- **src/renderer/**: Canvas rendering, layers, animation manager, and themes
- **src/input/**: Touch/click event handling and hit testing

### Input Handling

The InputHandler class manages:
- Touch events for mobile/tablet devices
- Click events for mouse input
- Converting screen coordinates to board positions
- Dispatching appropriate Redux actions based on input

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

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run test`: Run unit tests
- `npm run test:e2e`: Run end-to-end tests

### Dependencies

**Runtime:**
- redux: State management

**Development:**
- typescript: Type checking
- vite: Build tool and dev server
- vitest: Unit testing
- @playwright/test: E2E testing

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
