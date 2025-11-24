// Redux store configuration for Attax game
import { createStore, combineReducers, applyMiddleware, type Store, type Reducer } from 'redux';
import type { GameState } from '../types';
import { gameReducer, createInitialState } from './reducer';
import type { GameAction } from './actions';
import type { NetworkState, NetworkAction } from '../network/types';
import { networkReducer, createInitialNetworkState } from '../network/reducer';
import { networkMiddleware } from '../network/middleware';
import { SYNC_STATE, RECEIVE_MOVE } from '../network/actions';

// Combined state type
export interface CombinedState {
  game: GameState;
  network: NetworkState;
}

// Combined action type
export type CombinedAction = GameAction | NetworkAction;

// Extended game reducer that handles network actions
function extendedGameReducer(state: GameState = createInitialState(), action: CombinedAction): GameState {
  // Handle network-specific actions that affect game state
  if (action.type === SYNC_STATE) {
    return (action as { type: typeof SYNC_STATE; payload: { gameState: GameState } }).payload.gameState;
  }
  
  if (action.type === RECEIVE_MOVE) {
    const { from, to } = (action as { type: typeof RECEIVE_MOVE; payload: { from: { row: number; col: number }; to: { row: number; col: number } } }).payload;
    
    // First select the piece
    const cell = state.board[from.row]?.[from.col];
    if (!cell || cell.type !== 'piece' || cell.owner !== state.currentPlayer) {
      return state;
    }
    
    // Import dynamically to avoid circular dependencies
    const { getValidMoves } = require('../game/board');
    const { applyMove } = require('../game/moves');
    const { countPieces, hasAnyMoves } = require('../game/board');
    
    const validMoves = getValidMoves(state.board, from);
    const isValid = validMoves.some((m: { row: number; col: number }) => m.row === to.row && m.col === to.col);
    
    if (!isValid) {
      return state;
    }
    
    // Apply the move
    const newBoard = applyMove(state.board, from, to, state.currentPlayer);
    const scores = countPieces(newBoard);
    const opponent = state.currentPlayer === 'red' ? 'blue' : 'red';
    
    // Check if game is over
    const opponentHasMoves = hasAnyMoves(newBoard, opponent);
    const currentHasMoves = hasAnyMoves(newBoard, state.currentPlayer);
    
    let gameStatus: 'playing' | 'finished' = 'playing';
    let winner: 'red' | 'blue' | 'draw' | null = null;
    let nextPlayer = opponent;
    
    // Game ends when one color is eliminated
    if (scores.red === 0 || scores.blue === 0) {
      gameStatus = 'finished';
      winner = scores.red > scores.blue ? 'red' : scores.blue > scores.red ? 'blue' : 'draw';
    } else if (!opponentHasMoves && !currentHasMoves) {
      gameStatus = 'finished';
      winner = scores.red > scores.blue ? 'red' : scores.blue > scores.red ? 'blue' : 'draw';
    } else if (!opponentHasMoves) {
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
  
  // Delegate to original game reducer
  return gameReducer(state, action as GameAction);
}

// Root reducer
const rootReducer: Reducer<CombinedState, CombinedAction> = combineReducers({
  game: extendedGameReducer as Reducer<GameState, CombinedAction>,
  network: networkReducer as Reducer<NetworkState, CombinedAction>
});

export function configureStore(): Store<CombinedState, CombinedAction> {
  return createStore(
    rootReducer,
    {
      game: createInitialState(),
      network: createInitialNetworkState()
    },
    applyMiddleware(networkMiddleware)
  );
}

export type AppStore = Store<CombinedState, CombinedAction>;
