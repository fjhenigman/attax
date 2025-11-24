// Redux reducer for Attax game
import type { GameState, Player } from '../types';
import { createInitialBoard, countPieces, getValidMoves, hasAnyMoves } from '../game/board';
import { applyMove } from '../game/moves';
import { 
  type GameAction, 
  SELECT_PIECE, 
  DESELECT_PIECE, 
  MAKE_MOVE, 
  NEW_GAME 
} from './actions';

export function createInitialState(): GameState {
  const board = createInitialBoard();
  const scores = countPieces(board);
  
  return {
    board,
    currentPlayer: 'red',
    selectedPiece: null,
    validMoves: [],
    gameStatus: 'playing',
    winner: null,
    scores
  };
}

function getOpponent(player: Player): Player {
  return player === 'red' ? 'blue' : 'red';
}

function determineWinner(scores: { red: number; blue: number }): Player | 'draw' | null {
  if (scores.red > scores.blue) return 'red';
  if (scores.blue > scores.red) return 'blue';
  return 'draw';
}

export function gameReducer(
  state: GameState = createInitialState(),
  action: GameAction
): GameState {
  switch (action.type) {
    case SELECT_PIECE: {
      const { row, col } = action.payload;
      const cell = state.board[row]?.[col];
      
      // Only allow selecting current player's pieces
      if (!cell || cell.type !== 'piece' || cell.owner !== state.currentPlayer) {
        return state;
      }
      
      const validMoves = getValidMoves(state.board, action.payload);
      
      return {
        ...state,
        selectedPiece: action.payload,
        validMoves
      };
    }
    
    case DESELECT_PIECE: {
      return {
        ...state,
        selectedPiece: null,
        validMoves: []
      };
    }
    
    case MAKE_MOVE: {
      const { from, to } = action.payload;
      
      // Validate that there's a selected piece and it's a valid move
      if (!state.selectedPiece) return state;
      
      const isValid = state.validMoves.some(
        m => m.row === to.row && m.col === to.col
      );
      
      if (!isValid) return state;
      
      // Apply the move
      const newBoard = applyMove(state.board, from, to, state.currentPlayer);
      const scores = countPieces(newBoard);
      const opponent = getOpponent(state.currentPlayer);
      
      // Check if game is over
      const opponentHasMoves = hasAnyMoves(newBoard, opponent);
      const currentHasMoves = hasAnyMoves(newBoard, state.currentPlayer);
      
      let gameStatus: 'playing' | 'finished' = 'playing';
      let winner: Player | 'draw' | null = null;
      let nextPlayer = opponent;
      
      // Game ends when one color is eliminated
      if (scores.red === 0 || scores.blue === 0) {
        gameStatus = 'finished';
        winner = determineWinner(scores);
      } else if (!opponentHasMoves && !currentHasMoves) {
        // Neither player can move - game over
        gameStatus = 'finished';
        winner = determineWinner(scores);
      } else if (!opponentHasMoves) {
        // Opponent can't move, current player goes again
        nextPlayer = state.currentPlayer;
      }
      
      return {
        ...state,
        board: newBoard,
        currentPlayer: nextPlayer,
        selectedPiece: null,
        validMoves: [],
        gameStatus,
        winner,
        scores
      };
    }
    
    case NEW_GAME: {
      return createInitialState();
    }
    
    default:
      return state;
  }
}
