// Redux reducer for network state
import type { NetworkState } from './types';
import {
  type NetworkAction,
  SET_GAME_MODE,
  CREATE_GAME,
  GAME_CREATED,
  JOINING_GAME,
  PEER_CONNECTED,
  PEER_DISCONNECTED,
  NETWORK_ERROR,
  CLEAR_NETWORK_ERROR,
  CANCEL_ONLINE
} from './actions';

export function createInitialNetworkState(): NetworkState {
  return {
    mode: 'local',
    connectionStatus: 'disconnected',
    role: null,
    gameCode: null,
    shareableLink: null,
    playerColor: null,
    opponentConnected: false,
    error: null
  };
}

export function networkReducer(
  state: NetworkState = createInitialNetworkState(),
  action: NetworkAction
): NetworkState {
  switch (action.type) {
    case SET_GAME_MODE:
      return {
        ...state,
        mode: action.payload.mode,
        // Reset network state when switching to local
        ...(action.payload.mode === 'local' ? createInitialNetworkState() : {})
      };

    case CREATE_GAME:
      return {
        ...state,
        mode: 'online',
        connectionStatus: 'creating',
        role: 'host',
        error: null
      };

    case GAME_CREATED:
      return {
        ...state,
        connectionStatus: 'waiting',
        gameCode: action.payload.gameCode,
        shareableLink: action.payload.shareableLink,
        playerColor: action.payload.playerColor
      };

    case JOINING_GAME:
      return {
        ...state,
        mode: 'online',
        connectionStatus: 'connecting',
        role: 'guest',
        gameCode: action.payload.gameCode,
        error: null
      };

    case PEER_CONNECTED:
      return {
        ...state,
        connectionStatus: 'connected',
        opponentConnected: true,
        error: null,
        ...(action.payload ? {
          playerColor: action.payload.playerColor
        } : {})
      };

    case PEER_DISCONNECTED:
      return {
        ...state,
        connectionStatus: 'disconnected',
        opponentConnected: false
      };

    case NETWORK_ERROR:
      return {
        ...state,
        error: action.payload.error,
        connectionStatus: state.connectionStatus === 'connected' ? 'connected' : 'disconnected'
      };

    case CLEAR_NETWORK_ERROR:
      return {
        ...state,
        error: null
      };

    case CANCEL_ONLINE:
      return createInitialNetworkState();

    default:
      return state;
  }
}
