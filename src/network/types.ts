// Network types for online play
import type { Player, Position, GameState } from '../types';

// Message types for peer communication
export interface Message {
  type: string;
  timestamp: number;
  payload: unknown;
}

export interface GameStartPayload {
  hostColor: Player;
  gameState: GameState;
}

export interface MakeMovePayload {
  from: Position;
  to: Position;
}

export interface MoveAckPayload {
  move: {
    from: Position;
    to: Position;
  };
  newState: GameState;
}

export interface SyncStatePayload {
  gameState: GameState;
}

export interface GameStartMessage extends Message {
  type: 'GAME_START';
  payload: GameStartPayload;
}

export interface MakeMoveMessage extends Message {
  type: 'MAKE_MOVE';
  payload: MakeMovePayload;
}

export interface MoveAckMessage extends Message {
  type: 'MOVE_ACK';
  payload: MoveAckPayload;
}

export interface RequestRematchMessage extends Message {
  type: 'REQUEST_REMATCH';
  payload: Record<string, never>;
}

export interface RematchAcceptedMessage extends Message {
  type: 'REMATCH_ACCEPTED';
  payload: { gameState: GameState };
}

export interface PlayerLeftMessage extends Message {
  type: 'PLAYER_LEFT';
  payload: Record<string, never>;
}

export interface SyncStateMessage extends Message {
  type: 'SYNC_STATE';
  payload: SyncStatePayload;
}

export type NetworkMessage = 
  | GameStartMessage 
  | MakeMoveMessage 
  | MoveAckMessage 
  | RequestRematchMessage 
  | RematchAcceptedMessage 
  | PlayerLeftMessage 
  | SyncStateMessage;

// Network state for Redux
export interface NetworkState {
  mode: 'local' | 'online';
  connectionStatus: 'disconnected' | 'creating' | 'waiting' | 'connecting' | 'connected';
  role: 'host' | 'guest' | null;
  gameCode: string | null;
  shareableLink: string | null;
  playerColor: Player | null;
  opponentConnected: boolean;
  error: string | null;
}

// Peer manager types
export type PeerRole = 'host' | 'guest';

export interface PeerConnectionCallbacks {
  onConnect: () => void;
  onDisconnect: () => void;
  onMessage: (message: NetworkMessage) => void;
  onError: (error: Error) => void;
}
