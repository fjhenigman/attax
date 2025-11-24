// Types for Attax game

export type Player = 'red' | 'blue';

export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  type: 'empty' | 'piece';
  owner?: Player;
}

export interface GameState {
  board: Cell[][];
  currentPlayer: Player;
  selectedPiece: Position | null;
  validMoves: Position[];
  gameStatus: 'playing' | 'finished';
  winner: Player | 'draw' | null;
  scores: {
    red: number;
    blue: number;
  };
}

export type MoveType = 'clone' | 'jump';

export interface Move {
  from: Position;
  to: Position;
}
