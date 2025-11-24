// Animation system tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  linear, 
  easeOutBack, 
  easeInOutQuad, 
  getEasing,
  AnimationManager,
  CLONE_ANIMATION_DURATION,
  JUMP_ANIMATION_DURATION,
  CLONE_PHASES,
  JUMP_PHASES
} from './animation';

describe('Easing Functions', () => {
  describe('linear', () => {
    it('returns t unchanged', () => {
      expect(linear(0)).toBe(0);
      expect(linear(0.5)).toBe(0.5);
      expect(linear(1)).toBe(1);
    });
  });

  describe('easeOutBack', () => {
    it('starts at 0', () => {
      expect(easeOutBack(0)).toBeCloseTo(0, 5);
    });

    it('ends at 1', () => {
      expect(easeOutBack(1)).toBeCloseTo(1, 5);
    });

    it('overshoots slightly before settling', () => {
      // easeOutBack typically goes above 1 before settling
      const midValue = easeOutBack(0.7);
      expect(midValue).toBeGreaterThan(1);
    });
  });

  describe('easeInOutQuad', () => {
    it('starts at 0', () => {
      expect(easeInOutQuad(0)).toBe(0);
    });

    it('ends at 1', () => {
      expect(easeInOutQuad(1)).toBe(1);
    });

    it('is at 0.5 when t is 0.5', () => {
      expect(easeInOutQuad(0.5)).toBe(0.5);
    });
  });

  describe('getEasing', () => {
    it('returns the correct easing function', () => {
      expect(getEasing('linear')).toBe(linear);
      expect(getEasing('easeOutBack')).toBe(easeOutBack);
      expect(getEasing('easeInOutQuad')).toBe(easeInOutQuad);
    });
  });
});

describe('Animation Constants', () => {
  it('has correct clone animation duration', () => {
    expect(CLONE_ANIMATION_DURATION).toBe(500);
  });

  it('has correct jump animation duration', () => {
    expect(JUMP_ANIMATION_DURATION).toBe(600);
  });

  it('has correct clone phase timings', () => {
    expect(CLONE_PHASES.sourcePulse).toEqual({ start: 0, end: 150 });
    expect(CLONE_PHASES.cloneEmergence).toEqual({ start: 0, end: 300 });
    expect(CLONE_PHASES.conversions).toEqual({ start: 300, end: 500 });
  });

  it('has correct jump phase timings', () => {
    expect(JUMP_PHASES.liftOff).toEqual({ start: 0, end: 100 });
    expect(JUMP_PHASES.arcMovement).toEqual({ start: 100, end: 300 });
    expect(JUMP_PHASES.landing).toEqual({ start: 300, end: 400 });
    expect(JUMP_PHASES.conversions).toEqual({ start: 400, end: 600 });
  });
});

describe('AnimationManager', () => {
  let manager: AnimationManager;
  let mockOnFrame: ReturnType<typeof vi.fn>;
  let mockOnComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    manager = new AnimationManager();
    mockOnFrame = vi.fn();
    mockOnComplete = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    manager.stopAnimation();
    vi.useRealTimers();
  });

  it('starts in non-animating state', () => {
    expect(manager.isAnimating()).toBe(false);
  });

  it('isAnimating returns true during animation', () => {
    manager.startMoveAnimation(
      'clone',
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      'red',
      [],
      mockOnFrame,
      mockOnComplete
    );
    expect(manager.isAnimating()).toBe(true);
  });

  it('stopAnimation stops the animation', () => {
    manager.startMoveAnimation(
      'clone',
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      'red',
      [],
      mockOnFrame,
      mockOnComplete
    );
    manager.stopAnimation();
    expect(manager.isAnimating()).toBe(false);
  });

  it('getAnimationState returns null when not animating', () => {
    expect(manager.getAnimationState()).toBeNull();
  });

  it('getAnimationState returns animation state during animation', () => {
    manager.startMoveAnimation(
      'jump',
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      'blue',
      [{ row: 0, col: 1 }],
      mockOnFrame,
      mockOnComplete
    );
    
    const state = manager.getAnimationState();
    expect(state).not.toBeNull();
    expect(state?.type).toBe('jump');
    expect(state?.from).toEqual({ row: 0, col: 0 });
    expect(state?.to).toEqual({ row: 0, col: 2 });
    expect(state?.player).toBe('blue');
  });

  it('getAnimatedPositions returns empty when not animating', () => {
    const positions = manager.getAnimatedPositions();
    expect(positions.source).toBeNull();
    expect(positions.destination).toBeNull();
    expect(positions.conversions).toEqual([]);
  });

  it('getAnimatedPositions returns source for jump animation', () => {
    manager.startMoveAnimation(
      'jump',
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      'red',
      [],
      mockOnFrame,
      mockOnComplete
    );
    
    const positions = manager.getAnimatedPositions();
    expect(positions.source).toEqual({ row: 0, col: 0 });
    expect(positions.destination).toEqual({ row: 0, col: 2 });
  });

  it('getAnimatedPositions does not return source for clone animation', () => {
    manager.startMoveAnimation(
      'clone',
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      'red',
      [],
      mockOnFrame,
      mockOnComplete
    );
    
    const positions = manager.getAnimatedPositions();
    expect(positions.source).toBeNull();  // Clone keeps source visible
    expect(positions.destination).toEqual({ row: 0, col: 1 });
  });

  it('getSourcePieceState returns null for jump moves', () => {
    manager.startMoveAnimation(
      'jump',
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      'red',
      [],
      mockOnFrame,
      mockOnComplete
    );
    
    expect(manager.getSourcePieceState()).toBeNull();
  });

  it('getConversionStates returns conversion animations', () => {
    manager.startMoveAnimation(
      'clone',
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      'red',
      [{ row: 1, col: 1 }, { row: 0, col: 2 }],
      mockOnFrame,
      mockOnComplete
    );
    
    const conversions = manager.getConversionStates();
    expect(conversions.length).toBe(2);
    expect(conversions[0].position).toEqual({ row: 1, col: 1 });
    expect(conversions[1].position).toEqual({ row: 0, col: 2 });
    expect(conversions[0].fromOwner).toBe('blue');
    expect(conversions[0].toOwner).toBe('red');
  });

  it('shouldHideSourcePiece returns false when not animating', () => {
    expect(manager.shouldHideSourcePiece()).toBe(false);
  });

  it('shouldHideSourcePiece returns false for clone moves', () => {
    manager.startMoveAnimation(
      'clone',
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      'red',
      [],
      mockOnFrame,
      mockOnComplete
    );
    
    expect(manager.shouldHideSourcePiece()).toBe(false);
  });

  it('shouldHideSourcePiece returns true for jump moves', () => {
    manager.startMoveAnimation(
      'jump',
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      'red',
      [],
      mockOnFrame,
      mockOnComplete
    );
    
    expect(manager.shouldHideSourcePiece()).toBe(true);
  });

  it('shouldShowDestinationPiece returns false during animation', () => {
    manager.startMoveAnimation(
      'clone',
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      'red',
      [],
      mockOnFrame,
      mockOnComplete
    );
    
    expect(manager.shouldShowDestinationPiece()).toBe(false);
  });

  it('shouldShowDestinationPiece returns true when not animating', () => {
    expect(manager.shouldShowDestinationPiece()).toBe(true);
  });

  it('getMovingPieceState returns null when not animating', () => {
    expect(manager.getMovingPieceState()).toBeNull();
  });
});
