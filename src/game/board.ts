// Board utilities for Attax game
import type { Cell, Position, Player } from '../types';

export const BOARD_SIZE = 7;

export function createInitialBoard(): Cell[][] {
  const board: Cell[][] = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = { type: 'empty' };
    }
  }
  
  // Place initial pieces in corners
  // Red: top-left and bottom-right
  // Blue: top-right and bottom-left
  board[0][0] = { type: 'piece', owner: 'red' };
  board[BOARD_SIZE - 1][BOARD_SIZE - 1] = { type: 'piece', owner: 'red' };
  board[0][BOARD_SIZE - 1] = { type: 'piece', owner: 'blue' };
  board[BOARD_SIZE - 1][0] = { type: 'piece', owner: 'blue' };
  
  return board;
}

export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function countPieces(board: Cell[][]): { red: number; blue: number } {
  let red = 0;
  let blue = 0;
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = board[row][col];
      if (cell.type === 'piece') {
        if (cell.owner === 'red') red++;
        else if (cell.owner === 'blue') blue++;
      }
    }
  }
  
  return { red, blue };
}

export function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map(row => row.map(cell => ({ ...cell })));
}

export function hasAnyMoves(board: Cell[][], player: Player): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = board[row][col];
      if (cell.type === 'piece' && cell.owner === player) {
        const moves = getValidMoves(board, { row, col });
        if (moves.length > 0) return true;
      }
    }
  }
  return false;
}

export function getValidMoves(board: Cell[][], position: Position): Position[] {
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
