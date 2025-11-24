// PeerManager - handles WebRTC peer connections for online play
// Uses simple-peer for WebRTC and a custom signaling mechanism
import Peer from 'simple-peer';
import type { NetworkMessage, PeerRole, PeerConnectionCallbacks } from './types';

// Generate a random game code (6 alphanumeric characters)
function generateGameCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a shareable link with game code
export function createShareableLink(gameCode: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set('game', gameCode);
  return url.toString();
}

// Get game code from URL if present
export function getGameCodeFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('game');
}

// Clear game code from URL without reloading
export function clearGameCodeFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('game');
  window.history.replaceState({}, '', url.toString());
}

/**
 * PeerManager handles WebRTC connections using simple-peer
 * 
 * Signaling is done through BroadcastChannel (same browser) and
 * localStorage events (cross-tab). For production, a signaling
 * server would be required.
 */
export class PeerManager {
  private peer: Peer.Instance | null = null;
  private role: PeerRole | null = null;
  private gameCode: string | null = null;
  private callbacks: Partial<PeerConnectionCallbacks> = {};
  private broadcastChannel: BroadcastChannel | null = null;
  private storageListener: ((event: StorageEvent) => void) | null = null;
  private connected = false;

  constructor() {
    // Clean up any stale signaling data
    this.cleanupSignalingData();
  }

  private cleanupSignalingData(): void {
    // Remove old signaling data (older than 5 minutes)
    const keys = Object.keys(localStorage);
    const now = Date.now();
    for (const key of keys) {
      if (key.startsWith('attax_signal_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && now - data.timestamp > 5 * 60 * 1000) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    }
  }

  private setupSignaling(gameCode: string): void {
    this.gameCode = gameCode;
    
    // Use BroadcastChannel for same-browser communication
    this.broadcastChannel = new BroadcastChannel(`attax_game_${gameCode}`);
    this.broadcastChannel.onmessage = (event) => {
      this.handleSignalingMessage(event.data);
    };

    // Use localStorage events for cross-tab communication
    this.storageListener = (event: StorageEvent) => {
      if (event.key === `attax_signal_${gameCode}` && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data.from !== this.role) {
            this.handleSignalingMessage(data.signal);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };
    window.addEventListener('storage', this.storageListener);
  }

  private sendSignalingData(signal: Peer.SignalData): void {
    if (!this.gameCode) return;

    const message = {
      from: this.role,
      signal,
      timestamp: Date.now()
    };

    // Send via BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(signal);
    }

    // Also store in localStorage for cross-tab
    localStorage.setItem(`attax_signal_${this.gameCode}`, JSON.stringify(message));
    // Trigger storage event in the same tab (for testing)
    window.dispatchEvent(new StorageEvent('storage', {
      key: `attax_signal_${this.gameCode}`,
      newValue: JSON.stringify(message)
    }));
  }

  private handleSignalingMessage(signal: Peer.SignalData): void {
    if (this.peer && !this.peer.destroyed) {
      try {
        this.peer.signal(signal);
      } catch {
        // Ignore signal errors for already connected peers
      }
    }
  }

  /**
   * Create a new game as host
   * Returns the game code that guests can use to join
   */
  async createGame(): Promise<string> {
    const gameCode = generateGameCode();
    this.role = 'host';
    this.gameCode = gameCode;
    
    this.setupSignaling(gameCode);

    // Create peer as initiator
    this.peer = new Peer({
      initiator: true,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    this.setupPeerEvents();

    return gameCode;
  }

  /**
   * Join an existing game as guest
   */
  async joinGame(gameCode: string): Promise<void> {
    this.role = 'guest';
    this.gameCode = gameCode.toUpperCase();
    
    this.setupSignaling(this.gameCode);

    // Create peer as non-initiator
    this.peer = new Peer({
      initiator: false,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    this.setupPeerEvents();

    // Check for existing host signal in localStorage
    const existingSignal = localStorage.getItem(`attax_signal_${this.gameCode}`);
    if (existingSignal) {
      try {
        const data = JSON.parse(existingSignal);
        if (data.from === 'host' && data.signal) {
          this.handleSignalingMessage(data.signal);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  private setupPeerEvents(): void {
    if (!this.peer) return;

    this.peer.on('signal', (signal) => {
      this.sendSignalingData(signal);
    });

    this.peer.on('connect', () => {
      this.connected = true;
      this.callbacks.onConnect?.();
    });

    this.peer.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString()) as NetworkMessage;
        this.callbacks.onMessage?.(message);
      } catch {
        console.error('Failed to parse message');
      }
    });

    this.peer.on('close', () => {
      this.connected = false;
      this.callbacks.onDisconnect?.();
    });

    this.peer.on('error', (err) => {
      this.callbacks.onError?.(err);
    });
  }

  /**
   * Send a message to the connected peer
   */
  send(message: NetworkMessage): void {
    if (this.peer && this.connected) {
      this.peer.send(JSON.stringify(message));
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    // Notify peer we're leaving
    if (this.connected) {
      this.send({
        type: 'PLAYER_LEFT',
        timestamp: Date.now(),
        payload: {}
      });
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }

    // Clean up signaling data
    if (this.gameCode) {
      localStorage.removeItem(`attax_signal_${this.gameCode}`);
    }

    this.connected = false;
    this.role = null;
    this.gameCode = null;
  }

  /**
   * Get current role
   */
  getRole(): PeerRole | null {
    return this.role;
  }

  /**
   * Get current game code
   */
  getGameCode(): string | null {
    return this.gameCode;
  }

  /**
   * Check if connected to peer
   */
  isConnected(): boolean {
    return this.connected;
  }

  // Event handlers
  onConnect(handler: () => void): void {
    this.callbacks.onConnect = handler;
  }

  onDisconnect(handler: () => void): void {
    this.callbacks.onDisconnect = handler;
  }

  onMessage(handler: (message: NetworkMessage) => void): void {
    this.callbacks.onMessage = handler;
  }

  onError(handler: (error: Error) => void): void {
    this.callbacks.onError = handler;
  }
}

// Singleton instance
let peerManagerInstance: PeerManager | null = null;

export function getPeerManager(): PeerManager {
  if (!peerManagerInstance) {
    peerManagerInstance = new PeerManager();
  }
  return peerManagerInstance;
}

export function resetPeerManager(): void {
  if (peerManagerInstance) {
    peerManagerInstance.disconnect();
    peerManagerInstance = null;
  }
}
