// Move utilities for Attax game
import type { Cell, Position, Player, MoveType } from '../types';
import { isValidPosition, cloneBoard } from './board';

export function getMoveType(from: Position, to: Position): MoveType {
  const distance = Math.max(
    Math.abs(to.row - from.row),
    Math.abs(to.col - from.col)
  );
  return distance === 1 ? 'clone' : 'jump';
}

export function getConvertedPieces(
  board: Cell[][], 
  position: Position, 
  player: Player
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

export function applyMove(
  board: Cell[][],
  from: Position,
  to: Position,
  player: Player
): Cell[][] {
  const newBoard = cloneBoard(board);
  const moveType = getMoveType(from, to);
  
  // Place piece at destination
  newBoard[to.row][to.col] = { type: 'piece', owner: player };
  
  // If jump, remove piece from source
  if (moveType === 'jump') {
    newBoard[from.row][from.col] = { type: 'empty' };
  }
  
  // Convert adjacent opponent pieces
  const converted = getConvertedPieces(newBoard, to, player);
  for (const pos of converted) {
    newBoard[pos.row][pos.col] = { type: 'piece', owner: player };
  }
  
  return newBoard;
}
