// Unit tests for board utilities
import { describe, it, expect } from 'vitest';
import { 
  createInitialBoard, 
  isValidPosition, 
  countPieces, 
  getValidMoves,
  hasAnyMoves,
  cloneBoard,
  BOARD_SIZE 
} from './board';

describe('createInitialBoard', () => {
  it('creates a 7x7 board', () => {
    const board = createInitialBoard();
    expect(board.length).toBe(7);
    expect(board[0].length).toBe(7);
  });

  it('places red pieces in corners (top-left and bottom-right)', () => {
    const board = createInitialBoard();
    expect(board[0][0]).toEqual({ type: 'piece', owner: 'red' });
    expect(board[6][6]).toEqual({ type: 'piece', owner: 'red' });
  });

  it('places blue pieces in corners (top-right and bottom-left)', () => {
    const board = createInitialBoard();
    expect(board[0][6]).toEqual({ type: 'piece', owner: 'blue' });
    expect(board[6][0]).toEqual({ type: 'piece', owner: 'blue' });
  });

  it('all other cells are empty', () => {
    const board = createInitialBoard();
    let emptyCount = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col].type === 'empty') {
          emptyCount++;
        }
      }
    }
    expect(emptyCount).toBe(49 - 4); // 7x7 = 49 total, minus 4 pieces
  });
});

describe('isValidPosition', () => {
  it('returns true for valid positions', () => {
    expect(isValidPosition(0, 0)).toBe(true);
    expect(isValidPosition(3, 3)).toBe(true);
    expect(isValidPosition(6, 6)).toBe(true);
  });

  it('returns false for negative positions', () => {
    expect(isValidPosition(-1, 0)).toBe(false);
    expect(isValidPosition(0, -1)).toBe(false);
  });

  it('returns false for positions >= BOARD_SIZE', () => {
    expect(isValidPosition(7, 0)).toBe(false);
    expect(isValidPosition(0, 7)).toBe(false);
  });
});

describe('countPieces', () => {
  it('counts pieces correctly on initial board', () => {
    const board = createInitialBoard();
    const scores = countPieces(board);
    expect(scores.red).toBe(2);
    expect(scores.blue).toBe(2);
  });

  it('counts pieces after modifications', () => {
    const board = createInitialBoard();
    board[1][1] = { type: 'piece', owner: 'red' };
    const scores = countPieces(board);
    expect(scores.red).toBe(3);
    expect(scores.blue).toBe(2);
  });
});

describe('getValidMoves', () => {
  it('returns all empty cells within 2 squares', () => {
    const board = createInitialBoard();
    const moves = getValidMoves(board, { row: 0, col: 0 });
    
    // From top-left corner, valid moves are within reach
    expect(moves.length).toBeGreaterThan(0);
    
    // All moves should be to empty cells
    for (const move of moves) {
      expect(board[move.row][move.col].type).toBe('empty');
    }
  });

  it('does not include cells beyond 2 squares', () => {
    const board = createInitialBoard();
    const moves = getValidMoves(board, { row: 3, col: 3 });
    
    // All moves should be within 2 squares
    for (const move of moves) {
      const distance = Math.max(
        Math.abs(move.row - 3),
        Math.abs(move.col - 3)
      );
      expect(distance).toBeLessThanOrEqual(2);
    }
  });

  it('does not include occupied cells', () => {
    const board = createInitialBoard();
    const moves = getValidMoves(board, { row: 0, col: 0 });
    
    // Should not include the corner with the blue piece
    const hasCorner = moves.some(m => m.row === 0 && m.col === 6);
    expect(hasCorner).toBe(false);
  });
});

describe('hasAnyMoves', () => {
  it('returns true when player has moves', () => {
    const board = createInitialBoard();
    expect(hasAnyMoves(board, 'red')).toBe(true);
    expect(hasAnyMoves(board, 'blue')).toBe(true);
  });

  it('returns false when player has no pieces', () => {
    const board = createInitialBoard();
    // Remove all red pieces
    board[0][0] = { type: 'empty' };
    board[6][6] = { type: 'empty' };
    expect(hasAnyMoves(board, 'red')).toBe(false);
  });
});

describe('cloneBoard', () => {
  it('creates a deep copy', () => {
    const board = createInitialBoard();
    const clone = cloneBoard(board);
    
    // Modify clone
    clone[0][0] = { type: 'empty' };
    
    // Original should be unchanged
    expect(board[0][0]).toEqual({ type: 'piece', owner: 'red' });
  });
});
