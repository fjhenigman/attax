// Redux actions for network/online play
import type { NetworkState, NetworkMessage } from './types';
import type { Player, GameState } from '../types';

// Action types
export const SET_GAME_MODE = 'SET_GAME_MODE';
export const CREATE_GAME = 'CREATE_GAME';
export const GAME_CREATED = 'GAME_CREATED';
export const JOIN_GAME = 'JOIN_GAME';
export const JOINING_GAME = 'JOINING_GAME';
export const PEER_CONNECTED = 'PEER_CONNECTED';
export const PEER_DISCONNECTED = 'PEER_DISCONNECTED';
export const RECEIVE_MOVE = 'RECEIVE_MOVE';
export const SYNC_STATE = 'SYNC_STATE';
export const NETWORK_ERROR = 'NETWORK_ERROR';
export const CLEAR_NETWORK_ERROR = 'CLEAR_NETWORK_ERROR';
export const CANCEL_ONLINE = 'CANCEL_ONLINE';

// Action interfaces
export interface SetGameModeAction {
  type: typeof SET_GAME_MODE;
  payload: { mode: 'local' | 'online' };
}

export interface CreateGameAction {
  type: typeof CREATE_GAME;
}

export interface GameCreatedAction {
  type: typeof GAME_CREATED;
  payload: {
    gameCode: string;
    shareableLink: string;
    playerColor: Player;
  };
}

export interface JoinGameAction {
  type: typeof JOIN_GAME;
  payload: { gameCode: string };
}

export interface JoiningGameAction {
  type: typeof JOINING_GAME;
  payload: { gameCode: string };
}

export interface PeerConnectedAction {
  type: typeof PEER_CONNECTED;
  payload?: {
    playerColor: Player;
    gameState?: GameState;
  };
}

export interface PeerDisconnectedAction {
  type: typeof PEER_DISCONNECTED;
}

export interface ReceiveMoveAction {
  type: typeof RECEIVE_MOVE;
  payload: {
    from: { row: number; col: number };
    to: { row: number; col: number };
  };
}

export interface SyncStateAction {
  type: typeof SYNC_STATE;
  payload: { gameState: GameState };
}

export interface NetworkErrorAction {
  type: typeof NETWORK_ERROR;
  payload: { error: string };
}

export interface ClearNetworkErrorAction {
  type: typeof CLEAR_NETWORK_ERROR;
}

export interface CancelOnlineAction {
  type: typeof CANCEL_ONLINE;
}

export type NetworkAction =
  | SetGameModeAction
  | CreateGameAction
  | GameCreatedAction
  | JoinGameAction
  | JoiningGameAction
  | PeerConnectedAction
  | PeerDisconnectedAction
  | ReceiveMoveAction
  | SyncStateAction
  | NetworkErrorAction
  | ClearNetworkErrorAction
  | CancelOnlineAction;

// Action creators
export function setGameMode(mode: 'local' | 'online'): SetGameModeAction {
  return { type: SET_GAME_MODE, payload: { mode } };
}

export function createGame(): CreateGameAction {
  return { type: CREATE_GAME };
}

export function gameCreated(gameCode: string, shareableLink: string, playerColor: Player): GameCreatedAction {
  return { type: GAME_CREATED, payload: { gameCode, shareableLink, playerColor } };
}

export function joinGame(gameCode: string): JoinGameAction {
  return { type: JOIN_GAME, payload: { gameCode } };
}

export function joiningGame(gameCode: string): JoiningGameAction {
  return { type: JOINING_GAME, payload: { gameCode } };
}

export function peerConnected(playerColor?: Player, gameState?: GameState): PeerConnectedAction {
  if (playerColor) {
    return { type: PEER_CONNECTED, payload: { playerColor, gameState } };
  }
  return { type: PEER_CONNECTED };
}

export function peerDisconnected(): PeerDisconnectedAction {
  return { type: PEER_DISCONNECTED };
}

export function receiveMove(from: { row: number; col: number }, to: { row: number; col: number }): ReceiveMoveAction {
  return { type: RECEIVE_MOVE, payload: { from, to } };
}

export function syncState(gameState: GameState): SyncStateAction {
  return { type: SYNC_STATE, payload: { gameState } };
}

export function networkError(error: string): NetworkErrorAction {
  return { type: NETWORK_ERROR, payload: { error } };
}

export function clearNetworkError(): ClearNetworkErrorAction {
  return { type: CLEAR_NETWORK_ERROR };
}

export function cancelOnline(): CancelOnlineAction {
  return { type: CANCEL_ONLINE };
}
