// Redux actions for Attax game
import type { Position, Move } from '../types';

export const SELECT_PIECE = 'SELECT_PIECE';
export const DESELECT_PIECE = 'DESELECT_PIECE';
export const MAKE_MOVE = 'MAKE_MOVE';
export const NEW_GAME = 'NEW_GAME';

export interface SelectPieceAction {
  type: typeof SELECT_PIECE;
  payload: Position;
}

export interface DeselectPieceAction {
  type: typeof DESELECT_PIECE;
}

export interface MakeMoveAction {
  type: typeof MAKE_MOVE;
  payload: Move;
}

export interface NewGameAction {
  type: typeof NEW_GAME;
}

export type GameAction = 
  | SelectPieceAction 
  | DeselectPieceAction 
  | MakeMoveAction 
  | NewGameAction;

export function selectPiece(position: Position): SelectPieceAction {
  return { type: SELECT_PIECE, payload: position };
}

export function deselectPiece(): DeselectPieceAction {
  return { type: DESELECT_PIECE };
}

export function makeMove(from: Position, to: Position): MakeMoveAction {
  return { type: MAKE_MOVE, payload: { from, to } };
}

export function newGame(): NewGameAction {
  return { type: NEW_GAME };
}
