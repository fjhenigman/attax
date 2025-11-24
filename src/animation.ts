// Animation system for Attax game
// Based on DESIGN-MOVE-ANIMATIONS.md

import type { Position, Player, MoveType } from './types';

// Easing functions
export type EasingType = 'linear' | 'easeOutBack' | 'easeInOutQuad';

export function linear(t: number): number {
  return t;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function getEasing(type: EasingType): (t: number) => number {
  switch (type) {
    case 'linear': return linear;
    case 'easeOutBack': return easeOutBack;
    case 'easeInOutQuad': return easeInOutQuad;
  }
}

// Animation types
export type AnimationPhase = 
  | 'sourcePulse' 
  | 'cloneEmergence' 
  | 'liftOff' 
  | 'arcMovement' 
  | 'landing' 
  | 'conversion';

export interface AnimatedPiece {
  position: Position;
  owner: Player;
  scale: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
  rotation: number;  // For flip animation (0-180 degrees)
  shadow: {
    opacity: number;
    blur: number;
    offsetY: number;
  };
}

export interface ConversionAnimation {
  position: Position;
  fromOwner: Player;
  toOwner: Player;
  startTime: number;
  duration: number;
  rotation: number;  // Current rotation for flip effect
}

export interface MoveAnimation {
  type: MoveType;
  from: Position;
  to: Position;
  player: Player;
  startTime: number;
  duration: number;
  conversions: ConversionAnimation[];
  convertedPositions: Position[];  // Positions to be converted
}

// Animation timing constants from design document
export const CLONE_ANIMATION_DURATION = 500;
export const JUMP_ANIMATION_DURATION = 600;
export const CONVERSION_DURATION = 150;
export const CONVERSION_STAGGER_DELAY = 20;

// Clone animation phase timings (in ms)
export const CLONE_PHASES = {
  sourcePulse: { start: 0, end: 150 },
  cloneEmergence: { start: 0, end: 300 },
  conversions: { start: 300, end: 500 }
};

// Jump animation phase timings (in ms)
export const JUMP_PHASES = {
  liftOff: { start: 0, end: 100 },
  arcMovement: { start: 100, end: 300 },
  landing: { start: 300, end: 400 },
  conversions: { start: 400, end: 600 }
};

// Arc height as percentage of distance
export const ARC_HEIGHT_FACTOR = 0.25;

export class AnimationManager {
  private currentAnimation: MoveAnimation | null = null;
  private animationFrameId: number | null = null;
  private onComplete: (() => void) | null = null;
  private onFrame: (() => void) | null = null;

  public isAnimating(): boolean {
    return this.currentAnimation !== null;
  }

  public startMoveAnimation(
    type: MoveType,
    from: Position,
    to: Position,
    player: Player,
    convertedPositions: Position[],
    onFrame: () => void,
    onComplete: () => void
  ): void {
    const duration = type === 'clone' ? CLONE_ANIMATION_DURATION : JUMP_ANIMATION_DURATION;
    const phases = type === 'clone' ? CLONE_PHASES : JUMP_PHASES;
    
    // Create conversion animations with staggered timing
    const conversions: ConversionAnimation[] = convertedPositions.map((pos, index) => ({
      position: pos,
      fromOwner: player === 'red' ? 'blue' : 'red',
      toOwner: player,
      startTime: phases.conversions.start + (index * CONVERSION_STAGGER_DELAY),
      duration: CONVERSION_DURATION,
      rotation: 0
    }));

    this.currentAnimation = {
      type,
      from,
      to,
      player,
      startTime: performance.now(),
      duration,
      conversions,
      convertedPositions
    };

    this.onFrame = onFrame;
    this.onComplete = onComplete;
    this.animate();
  }

  private animate = (): void => {
    if (!this.currentAnimation) return;

    const elapsed = performance.now() - this.currentAnimation.startTime;
    
    // Update conversion rotations
    for (const conv of this.currentAnimation.conversions) {
      const convElapsed = elapsed - conv.startTime;
      if (convElapsed >= 0 && convElapsed < conv.duration) {
        conv.rotation = (convElapsed / conv.duration) * 180;
      } else if (convElapsed >= conv.duration) {
        conv.rotation = 180;
      }
    }

    // Call frame callback
    this.onFrame?.();

    // Check if animation is complete
    if (elapsed >= this.currentAnimation.duration) {
      this.completeAnimation();
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private completeAnimation(): void {
    this.currentAnimation = null;
    this.animationFrameId = null;
    this.onComplete?.();
    this.onComplete = null;
    this.onFrame = null;
  }

  public stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.currentAnimation = null;
    this.onComplete = null;
    this.onFrame = null;
  }

  public getAnimationState(): MoveAnimation | null {
    return this.currentAnimation;
  }

  // Get the animated state for the moving piece
  public getMovingPieceState(): AnimatedPiece | null {
    if (!this.currentAnimation) return null;

    const anim = this.currentAnimation;
    const elapsed = performance.now() - anim.startTime;

    if (anim.type === 'clone') {
      return this.getCloneAnimationState(anim, elapsed);
    } else {
      return this.getJumpAnimationState(anim, elapsed);
    }
  }

  // Get the source piece state (for clone pulse effect)
  public getSourcePieceState(): AnimatedPiece | null {
    if (!this.currentAnimation) return null;
    if (this.currentAnimation.type !== 'clone') return null;

    const anim = this.currentAnimation;
    const elapsed = performance.now() - anim.startTime;

    // Source pulse effect
    const { start, end } = CLONE_PHASES.sourcePulse;
    if (elapsed >= start && elapsed < end) {
      const t = (elapsed - start) / (end - start);
      // Pulse: 1.0 -> 1.1 -> 1.0
      const scale = 1 + 0.1 * Math.sin(t * Math.PI);
      
      return {
        position: anim.from,
        owner: anim.player,
        scale,
        opacity: 1,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        shadow: { opacity: 0, blur: 0, offsetY: 0 }
      };
    }

    return null;
  }

  private getCloneAnimationState(anim: MoveAnimation, elapsed: number): AnimatedPiece | null {
    // Clone emergence animation
    const { start, end } = CLONE_PHASES.cloneEmergence;
    if (elapsed < start) return null;
    if (elapsed >= end) {
      // Animation complete - full size
      return {
        position: anim.to,
        owner: anim.player,
        scale: 1,
        opacity: 1,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        shadow: { opacity: 0, blur: 0, offsetY: 0 }
      };
    }

    // During emergence
    const t = (elapsed - start) / (end - start);
    const scale = easeOutBack(t);
    
    return {
      position: anim.to,
      owner: anim.player,
      scale,
      opacity: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      shadow: { opacity: 0, blur: 0, offsetY: 0 }
    };
  }

  private getJumpAnimationState(anim: MoveAnimation, elapsed: number): AnimatedPiece | null {
    const { liftOff, arcMovement, landing } = JUMP_PHASES;

    // Base piece state
    const piece: AnimatedPiece = {
      position: anim.from,
      owner: anim.player,
      scale: 1,
      opacity: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      shadow: { opacity: 0, blur: 0, offsetY: 0 }
    };

    if (elapsed < liftOff.start) {
      return null;
    }

    if (elapsed < liftOff.end) {
      // Lift-off phase: scale increases, shadow appears
      const t = (elapsed - liftOff.start) / (liftOff.end - liftOff.start);
      const eased = easeInOutQuad(t);
      piece.scale = 1 + 0.2 * eased;
      piece.shadow = {
        opacity: 0.3 * eased,
        blur: 10 * eased,
        offsetY: 5 * eased
      };
      return piece;
    }

    if (elapsed < arcMovement.end) {
      // Arc movement phase
      const t = (elapsed - arcMovement.start) / (arcMovement.end - arcMovement.start);
      const eased = easeInOutQuad(t);

      // Calculate position along arc
      // offsetX and offsetY are calculated as distance from source
      const dx = (anim.to.col - anim.from.col);
      const dy = (anim.to.row - anim.from.row);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const arcHeight = distance * ARC_HEIGHT_FACTOR;

      piece.offsetX = dx * eased;
      piece.offsetY = dy * eased - arcHeight * Math.sin(Math.PI * eased);
      piece.scale = 1.2;
      piece.shadow = {
        opacity: 0.3,
        blur: 10,
        offsetY: 5 + arcHeight * Math.sin(Math.PI * eased) * 10
      };
      return piece;
    }

    if (elapsed < landing.end) {
      // Landing phase: scale returns to normal with bounce
      const t = (elapsed - landing.start) / (landing.end - landing.start);
      
      // Position is at destination
      piece.position = anim.to;
      piece.offsetX = 0;
      piece.offsetY = 0;
      
      // Bounce: 1.2 -> 0.95 -> 1.0
      let scale: number;
      if (t < 0.5) {
        // 1.2 -> 0.95
        scale = 1.2 - (1.2 - 0.95) * (t / 0.5);
      } else {
        // 0.95 -> 1.0
        scale = 0.95 + (1.0 - 0.95) * ((t - 0.5) / 0.5);
      }
      piece.scale = scale;
      
      // Shadow fades out
      piece.shadow = {
        opacity: 0.3 * (1 - t),
        blur: 10 * (1 - t),
        offsetY: 5 * (1 - t)
      };
      return piece;
    }

    // After landing phase, piece is at destination with normal scale
    piece.position = anim.to;
    piece.offsetX = 0;
    piece.offsetY = 0;
    piece.scale = 1;
    piece.shadow = { opacity: 0, blur: 0, offsetY: 0 };
    return piece;
  }

  public getConversionStates(): ConversionAnimation[] {
    if (!this.currentAnimation) return [];
    return this.currentAnimation.conversions;
  }

  // Check if source piece should be hidden (for jump moves after lift-off)
  public shouldHideSourcePiece(): boolean {
    if (!this.currentAnimation) return false;
    if (this.currentAnimation.type === 'clone') return false;
    
    // For jump moves, hide source after lift-off begins
    const elapsed = performance.now() - this.currentAnimation.startTime;
    return elapsed >= JUMP_PHASES.liftOff.start;
  }

  // Check if destination piece should be shown (for state update before animation completes)
  public shouldShowDestinationPiece(): boolean {
    if (!this.currentAnimation) return true;
    
    // Show destination piece only after animation is complete
    // During animation, we render the animated piece instead
    return false;
  }

  // Get positions that are currently being animated (should not be rendered normally)
  public getAnimatedPositions(): { source: Position | null; destination: Position | null; conversions: Position[] } {
    if (!this.currentAnimation) {
      return { source: null, destination: null, conversions: [] };
    }

    const anim = this.currentAnimation;
    const elapsed = performance.now() - anim.startTime;

    let source: Position | null = null;
    let destination: Position | null = null;

    if (anim.type === 'jump') {
      // For jump, source is hidden during animation
      source = anim.from;
    }

    // Destination is always handled by animation
    destination = anim.to;

    // Get converting positions that are currently animating
    const conversions: Position[] = [];
    for (const conv of anim.conversions) {
      const convElapsed = elapsed - conv.startTime;
      if (convElapsed >= 0 && convElapsed < conv.duration) {
        conversions.push(conv.position);
      }
    }

    return { source, destination, conversions };
  }
}
