// Unit tests for move utilities
import { describe, it, expect } from 'vitest';
import { getMoveType, getConvertedPieces, applyMove } from './moves';
import { createInitialBoard } from './board';

describe('getMoveType', () => {
  it('returns clone for adjacent moves (distance 1)', () => {
    expect(getMoveType({ row: 0, col: 0 }, { row: 0, col: 1 })).toBe('clone');
    expect(getMoveType({ row: 0, col: 0 }, { row: 1, col: 0 })).toBe('clone');
    expect(getMoveType({ row: 0, col: 0 }, { row: 1, col: 1 })).toBe('clone');
  });

  it('returns jump for distance 2 moves', () => {
    expect(getMoveType({ row: 0, col: 0 }, { row: 0, col: 2 })).toBe('jump');
    expect(getMoveType({ row: 0, col: 0 }, { row: 2, col: 0 })).toBe('jump');
    expect(getMoveType({ row: 0, col: 0 }, { row: 2, col: 2 })).toBe('jump');
    expect(getMoveType({ row: 0, col: 0 }, { row: 1, col: 2 })).toBe('jump');
  });
});

describe('getConvertedPieces', () => {
  it('returns empty array when no adjacent opponent pieces', () => {
    const board = createInitialBoard();
    const converted = getConvertedPieces(board, { row: 3, col: 3 }, 'red');
    expect(converted).toEqual([]);
  });

  it('returns adjacent opponent pieces', () => {
    const board = createInitialBoard();
    // Place a red piece next to a blue piece at (0, 6)
    const converted = getConvertedPieces(board, { row: 0, col: 5 }, 'red');
    expect(converted.length).toBe(1);
    expect(converted[0]).toEqual({ row: 0, col: 6 });
  });

  it('does not include own pieces', () => {
    const board = createInitialBoard();
    // Check from position adjacent to red piece at (0, 0)
    const converted = getConvertedPieces(board, { row: 1, col: 0 }, 'red');
    expect(converted.every(p => !(p.row === 0 && p.col === 0))).toBe(true);
  });
});

describe('applyMove', () => {
  it('clones piece for adjacent moves', () => {
    const board = createInitialBoard();
    const newBoard = applyMove(board, { row: 0, col: 0 }, { row: 1, col: 0 }, 'red');
    
    // Original piece should still be there
    expect(newBoard[0][0]).toEqual({ type: 'piece', owner: 'red' });
    // New piece should be placed
    expect(newBoard[1][0]).toEqual({ type: 'piece', owner: 'red' });
  });

  it('removes original piece for jump moves', () => {
    const board = createInitialBoard();
    const newBoard = applyMove(board, { row: 0, col: 0 }, { row: 2, col: 0 }, 'red');
    
    // Original position should be empty
    expect(newBoard[0][0]).toEqual({ type: 'empty' });
    // New piece should be placed
    expect(newBoard[2][0]).toEqual({ type: 'piece', owner: 'red' });
  });

  it('converts adjacent opponent pieces', () => {
    const board = createInitialBoard();
    // Move red piece to (0, 5), adjacent to blue at (0, 6)
    const newBoard = applyMove(board, { row: 0, col: 0 }, { row: 0, col: 5 }, 'red');
    
    // Blue piece at (0, 6) should now be red
    expect(newBoard[0][6]).toEqual({ type: 'piece', owner: 'red' });
  });

  it('does not modify the original board', () => {
    const board = createInitialBoard();
    applyMove(board, { row: 0, col: 0 }, { row: 1, col: 0 }, 'red');
    
    // Original board should be unchanged
    expect(board[1][0]).toEqual({ type: 'empty' });
  });
});
