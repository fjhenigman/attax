// Redux middleware for network/online play
import type { Middleware, Dispatch } from 'redux';
import type { CombinedState } from '../store';
import type { GameAction, MakeMoveAction } from '../store/actions';
import type { NetworkAction } from './actions';
import { MAKE_MOVE, NEW_GAME } from '../store/actions';
import {
  CREATE_GAME,
  JOIN_GAME,
  CANCEL_ONLINE,
  gameCreated,
  joiningGame,
  peerConnected,
  peerDisconnected,
  syncState,
  networkError,
  receiveMove
} from './actions';
import { 
  getPeerManager, 
  createShareableLink,
  resetPeerManager
} from './PeerManager';
import type { NetworkMessage } from './types';

type CombinedAction = GameAction | NetworkAction;

/**
 * Middleware that handles network operations for online play
 */
export const networkMiddleware: Middleware<
  Record<string, never>,
  CombinedState,
  Dispatch<CombinedAction>
> = (store) => (next) => (action: CombinedAction) => {
  const state = store.getState();
  const peerManager = getPeerManager();

  switch (action.type) {
    case CREATE_GAME: {
      // First dispatch to update state to 'creating'
      const result = next(action);

      // Create the game and setup callbacks
      peerManager.createGame()
        .then((gameCode) => {
          const link = createShareableLink(gameCode);
          store.dispatch(gameCreated(gameCode, link, 'red'));

          // Setup connection handlers
          peerManager.onConnect(() => {
            // Host sends GAME_START when guest connects
            const currentState = store.getState();
            peerManager.send({
              type: 'GAME_START',
              timestamp: Date.now(),
              payload: {
                hostColor: 'red',
                gameState: currentState.game
              }
            });
            store.dispatch(peerConnected());
          });

          peerManager.onDisconnect(() => {
            store.dispatch(peerDisconnected());
          });

          peerManager.onMessage((message: NetworkMessage) => {
            handleIncomingMessage(store, message);
          });

          peerManager.onError((err) => {
            store.dispatch(networkError(err.message));
          });
        })
        .catch((err) => {
          store.dispatch(networkError(err.message || 'Failed to create game'));
        });

      return result;
    }

    case JOIN_GAME: {
      const { gameCode } = (action as { type: typeof JOIN_GAME; payload: { gameCode: string } }).payload;
      
      // Dispatch joining action
      store.dispatch(joiningGame(gameCode));

      // Join the game
      peerManager.joinGame(gameCode)
        .then(() => {
          // Setup connection handlers
          peerManager.onConnect(() => {
            // Guest waits for GAME_START from host
          });

          peerManager.onDisconnect(() => {
            store.dispatch(peerDisconnected());
          });

          peerManager.onMessage((message: NetworkMessage) => {
            handleIncomingMessage(store, message);
          });

          peerManager.onError((err) => {
            store.dispatch(networkError(err.message));
          });
        })
        .catch((err) => {
          store.dispatch(networkError(err.message || 'Failed to join game'));
        });

      return next(action);
    }

    case MAKE_MOVE: {
      const networkState = state.network;
      
      // For online games, send move to peer
      if (networkState.mode === 'online' && networkState.connectionStatus === 'connected') {
        // Only send if it's our turn
        if (state.game.currentPlayer === networkState.playerColor) {
          const moveAction = action as MakeMoveAction;
          
          // Apply locally first (optimistic update)
          const result = next(action);
          
          // Send to peer
          peerManager.send({
            type: 'MAKE_MOVE',
            timestamp: Date.now(),
            payload: moveAction.payload
          });
          
          return result;
        }
      }
      
      return next(action);
    }

    case NEW_GAME: {
      const networkState = state.network;
      
      // If in online mode, reset network state
      if (networkState.mode === 'online') {
        resetPeerManager();
        // Will be handled by game reducer, but also reset network
        const result = next(action);
        return result;
      }
      
      return next(action);
    }

    case CANCEL_ONLINE: {
      resetPeerManager();
      return next(action);
    }

    default:
      return next(action);
  }
};

/**
 * Handle incoming messages from peer
 */
function handleIncomingMessage(
  store: { dispatch: Dispatch<CombinedAction>; getState: () => CombinedState },
  message: NetworkMessage
): void {
  const state = store.getState();

  switch (message.type) {
    case 'GAME_START': {
      // Guest receives initial game state from host
      if (state.network.role === 'guest') {
        const payload = message.payload as { hostColor: 'red' | 'blue'; gameState: CombinedState['game'] };
        const guestColor = payload.hostColor === 'red' ? 'blue' : 'red';
        store.dispatch(peerConnected(guestColor, payload.gameState));
        store.dispatch(syncState(payload.gameState));
      }
      break;
    }

    case 'MAKE_MOVE': {
      const payload = message.payload as { from: { row: number; col: number }; to: { row: number; col: number } };
      
      // Validate it's opponent's turn
      const networkState = state.network;
      const opponentColor = networkState.playerColor === 'red' ? 'blue' : 'red';
      
      if (state.game.currentPlayer === opponentColor) {
        // Apply the move through our reducer
        store.dispatch(receiveMove(payload.from, payload.to));
      }
      break;
    }

    case 'SYNC_STATE': {
      const payload = message.payload as { gameState: CombinedState['game'] };
      store.dispatch(syncState(payload.gameState));
      break;
    }

    case 'PLAYER_LEFT': {
      store.dispatch(peerDisconnected());
      break;
    }

    case 'REQUEST_REMATCH': {
      // TODO: Handle rematch requests
      break;
    }

    case 'REMATCH_ACCEPTED': {
      // TODO: Handle rematch acceptance
      break;
    }
  }
}
