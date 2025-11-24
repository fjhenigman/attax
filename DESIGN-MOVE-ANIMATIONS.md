# Move Animations Design Document

## Overview

This document describes the animation system for piece moves in Attax. The game has two types of moves, each with distinct visual animations that communicate the action to players.

---

## Move Types

### 1. Clone Move (One-Cell Move)

A **clone move** occurs when a piece moves to an adjacent cell (distance of 1). The original piece remains in place, and a new piece appears at the destination.

### 2. Jump Move (Two-Cell Move)

A **jump move** occurs when a piece moves to a cell two squares away (distance of 2). The original piece disappears from its starting position and reappears at the destination.

---

## Animation Phases

Both move types share a common animation structure with the following phases:

1. **Pre-Move Phase**: Visual preparation before the move begins
2. **Movement Phase**: The main movement animation
3. **Conversion Phase**: Adjacent opponent pieces change color
4. **Post-Move Phase**: Final settling and state update

---

## Clone Move Animation (One-Cell Move)

### Description

When a player makes a clone move, the piece "spawns" or "grows" a duplicate in the adjacent cell while the original piece remains stationary.

### Animation Sequence

```
Timeline: 0ms -------- 150ms -------- 300ms -------- 500ms
          |            |              |              |
          Start        Clone         Clone          Conversion
          Pulse        Emerges       Complete       Animation
```

#### Phase 1: Source Pulse (0–150ms)

- **Visual**: The source piece briefly pulses or glows to indicate it is the origin
- **Effect**: A subtle scale animation (1.0 → 1.1 → 1.0) with a glow effect
- **Color**: The piece's color intensifies slightly (e.g., red becomes brighter red)

#### Phase 2: Clone Emergence (0–300ms)

- **Visual**: A new piece emerges at the destination cell
- **Effect**: The clone piece starts at scale 0 and grows to full size (0 → 1.0)
- **Easing**: Ease-out curve for a "popping" effect
- **Optional**: A subtle particle or ripple effect at the destination

#### Phase 3: Conversion Animation (300–500ms)

- **Visual**: Adjacent opponent pieces flip/morph to the current player's color
- **Effect**: Each converted piece transitions through a rotation or color blend
- **Timing**: Conversions can happen simultaneously or with a slight stagger (20ms delay between each)

### Pseudocode

```typescript
// Effect types for animations
type EffectType = 'pulse' | 'grow' | 'colorFlip' | 'lift' | 'arcPath' | 'bounce';
type EasingType = 'linear' | 'easeOutBack' | 'easeInOutQuad';

interface ScaleRange {
  from: number;
  to: number;
  peak?: number;  // Optional for pulse effects
  final?: number; // Optional for bounce effects
}

interface PhaseConfig {
  start: number;  // Start time in ms
  end: number;    // End time in ms
  effect: EffectType;
}

interface CloneMoveAnimation {
  type: 'clone';
  duration: number; // total duration in ms (500)
  phases: {
    sourcePulse: PhaseConfig & {
      scale: ScaleRange; // { from: 1.0, peak: 1.1, to: 1.0 }
    };
    cloneEmergence: PhaseConfig & {
      scale: ScaleRange; // { from: 0, to: 1.0 }
      easing: EasingType;
    };
    conversions: PhaseConfig & {
      staggerDelay: number; // delay between each conversion (20ms)
    };
  };
}
```

---

## Jump Move Animation (Two-Cell Move)

### Description

When a player makes a jump move, the piece travels from its original position to the destination cell, leaving the original cell empty.

### Animation Sequence

```
Timeline: 0ms -------- 200ms -------- 400ms -------- 600ms
          |            |              |              |
          Lift-off     Arc Peak       Landing        Conversion
          Animation                   Animation      Animation
```

#### Phase 1: Lift-Off (0–100ms)

- **Visual**: The piece lifts from the board, growing slightly and adding a shadow
- **Effect**: Scale increases (1.0 → 1.2), shadow appears beneath, piece rises slightly
- **Purpose**: Prepares the viewer for movement and distinguishes from clone

#### Phase 2: Arc Movement (100–300ms)

- **Visual**: The piece follows a curved arc path from source to destination
- **Effect**: The piece travels along a parabolic trajectory
- **Path Calculation** (where `t` ranges from 0 to 1, with 0 at source and 1 at destination):
  ```
  x(t) = sourceX + (destX - sourceX) * t
  y(t) = sourceY + (destY - sourceY) * t - arcHeight * sin(π * t)
  ```
- **Arc Height**: Approximately 20–30% of the travel distance
- **Shadow**: Shadow on the board tracks beneath the piece, scaled by height

#### Phase 3: Landing (300–400ms)

- **Visual**: The piece lands at the destination with a subtle bounce
- **Effect**: Scale returns to normal (1.2 → 1.0 → 0.95 → 1.0)
- **Optional**: Small dust/particle effect or ripple on landing
- **Shadow**: Shadow shrinks and disappears as piece lands

#### Phase 4: Conversion Animation (400–600ms)

- **Visual**: Adjacent opponent pieces convert to the current player's color
- **Effect**: Same as clone move conversion animation
- **Timing**: Staggered conversions with 20ms delay between each

### Pseudocode

```typescript
interface ShadowConfig {
  opacity: number;
  blur: number;
}

interface JumpMoveAnimation {
  type: 'jump';
  duration: number; // total duration in ms (600)
  phases: {
    liftOff: PhaseConfig & {
      scale: ScaleRange; // { from: 1.0, to: 1.2 }
      shadow: ShadowConfig; // { opacity: 0.3, blur: 10 }
    };
    arcMovement: PhaseConfig & {
      arcHeight: number; // 0.25 = 25% of distance
      easing: EasingType;
    };
    landing: PhaseConfig & {
      scale: ScaleRange; // { from: 1.2, to: 0.95, final: 1.0 }
    };
    conversions: PhaseConfig & {
      staggerDelay: number; // delay between each conversion (20ms)
    };
  };
}
```

---

## Conversion Animation Details

When pieces are converted, a smooth visual transition communicates the change of ownership.

### Effect Options

#### Option A: Color Blend

- Piece color smoothly transitions from opponent's color to player's color
- Duration: 100–150ms per piece
- Easing: Linear or ease-in-out

#### Option B: Flip/Rotate

- Piece appears to flip along its vertical axis (3D rotation effect)
- At the midpoint (90°), the color switches
- Duration: 150–200ms per piece
- Gives a satisfying "card flip" feel

#### Option C: Pulse and Change

- Piece shrinks slightly (0.9 scale), changes color, then expands back
- Duration: 150ms per piece
- Simple but effective

### Recommended Approach

Use **Option B (Flip/Rotate)** for its visual clarity and satisfaction, with **Option A (Color Blend)** as a fallback for lower-performance devices.

---

## Timing and Performance

### Duration Guidelines

| Animation Component  | Duration | Notes                          |
|---------------------|----------|--------------------------------|
| Clone move (total)  | 500ms    | Quick and snappy               |
| Jump move (total)   | 600ms    | Slightly longer for arc travel |
| Conversion per piece| 150ms    | Stagger delay: 20ms            |
| Maximum total time  | 800ms    | All conversions complete       |

### Performance Considerations

- Use `requestAnimationFrame` for smooth 60fps animations
- Batch canvas operations where possible
- Consider reducing animation complexity on slower devices
- Pre-calculate arc paths when animation starts
- Use dirty rectangle rendering for conversion animations

---

## Visual Diagram

### Clone Move

```
Before:              During:              After:
┌───┬───┬───┐        ┌───┬───┬───┐        ┌───┬───┬───┐
│ ● │   │ ○ │        │ ● │ ◐ │ ○ │        │ ● │ ● │ ● │
├───┼───┼───┤   →    ├───┼───┼───┤   →    ├───┼───┼───┤
│   │   │   │        │   │   │   │        │   │   │   │
└───┴───┴───┘        └───┴───┴───┘        └───┴───┴───┘

● = Player piece    ◐ = Emerging clone    ○ = Opponent (converts)
```

### Jump Move

```
Before:              During:              After:
┌───┬───┬───┐        ┌───┬───┬───┐        ┌───┬───┬───┐
│ ● │   │ ○ │        │   │ ⬤ │ ○ │        │   │   │ ● │
├───┼───┼───┤   →    ├───┼───┼───┤   →    ├───┼───┼───┤
│   │   │   │        │ ◌ │   │   │        │   │   │   │
└───┴───┴───┘        └───┴───┴───┘        └───┴───┴───┘

● = Player piece    ⬤ = Piece mid-jump    ◌ = Shadow    ○ = Opponent (converts)
```

---

## Integration Points

### State Management

The animation system should:

1. Block input during animations (set `isAnimating` flag in store)
2. Queue the state update until animation completes
3. Support animation speed settings (normal, fast, instant)

### Renderer Integration

New components required:

- `AnimationManager`: Tracks and updates active animations
- `AnimationLayer`: Renders animated pieces separately from static pieces
- Easing functions: `easeOutBack`, `easeInOutQuad`, `linear`

### Configuration

```typescript
// Animation speed presets with their multipliers
type AnimationSpeed = 'normal' | 'fast' | 'instant';

const SPEED_MULTIPLIERS: Record<AnimationSpeed, number> = {
  normal: 1.0,
  fast: 2.0,
  instant: Infinity  // Skip animations entirely
};

interface AnimationSettings {
  enabled: boolean;
  speed: AnimationSpeed;
  showConversionEffects: boolean;
}
```

---

## Summary

| Move Type | Total Duration | Key Visual Effect                      |
|-----------|---------------|----------------------------------------|
| Clone     | 500ms         | Original pulses, clone emerges/grows   |
| Jump      | 600ms         | Piece arcs through air to destination  |

Both animations conclude with opponent piece conversions, creating a satisfying visual feedback loop that helps players understand the game's mechanics.
