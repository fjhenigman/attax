// PeerManager - handles WebRTC peer connections for online play
// Uses native WebRTC APIs with BroadcastChannel/localStorage for signaling
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

// Signal data types
interface SignalData {
  type: 'offer' | 'answer' | 'candidate';
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

/**
 * PeerManager handles WebRTC connections using native browser APIs
 * 
 * Signaling is done through BroadcastChannel (same browser) and
 * localStorage events (cross-tab). For production, a signaling
 * server would be required.
 */
export class PeerManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private role: PeerRole | null = null;
  private gameCode: string | null = null;
  private callbacks: Partial<PeerConnectionCallbacks> = {};
  private broadcastChannel: BroadcastChannel | null = null;
  private storageListener: ((event: StorageEvent) => void) | null = null;
  private connected = false;
  private pendingCandidates: RTCIceCandidateInit[] = [];

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

  private sendSignalingData(signal: SignalData): void {
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

  private async handleSignalingMessage(signal: SignalData): Promise<void> {
    if (!this.peerConnection) return;

    try {
      if (signal.type === 'offer') {
        await this.peerConnection.setRemoteDescription(signal.data as RTCSessionDescriptionInit);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.sendSignalingData({ type: 'answer', data: answer });
        
        // Apply pending ICE candidates
        for (const candidate of this.pendingCandidates) {
          await this.peerConnection.addIceCandidate(candidate);
        }
        this.pendingCandidates = [];
      } else if (signal.type === 'answer') {
        await this.peerConnection.setRemoteDescription(signal.data as RTCSessionDescriptionInit);
        
        // Apply pending ICE candidates
        for (const candidate of this.pendingCandidates) {
          await this.peerConnection.addIceCandidate(candidate);
        }
        this.pendingCandidates = [];
      } else if (signal.type === 'candidate') {
        if (this.peerConnection.remoteDescription) {
          await this.peerConnection.addIceCandidate(signal.data as RTCIceCandidateInit);
        } else {
          // Queue the candidate until remote description is set
          this.pendingCandidates.push(signal.data as RTCIceCandidateInit);
        }
      }
    } catch (err) {
      console.error('Error handling signaling message:', err);
    }
  }

  private createPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingData({ type: 'candidate', data: event.candidate.toJSON() });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'connected') {
        this.connected = true;
        this.callbacks.onConnect?.();
      } else if (this.peerConnection?.connectionState === 'disconnected' ||
                 this.peerConnection?.connectionState === 'failed') {
        this.connected = false;
        this.callbacks.onDisconnect?.();
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };
  }

  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      this.connected = true;
      this.callbacks.onConnect?.();
    };

    this.dataChannel.onclose = () => {
      this.connected = false;
      this.callbacks.onDisconnect?.();
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as NetworkMessage;
        this.callbacks.onMessage?.(message);
      } catch {
        console.error('Failed to parse message');
      }
    };

    this.dataChannel.onerror = (event) => {
      this.callbacks.onError?.(new Error('Data channel error: ' + event));
    };
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
    this.createPeerConnection();

    // Host creates the data channel
    this.dataChannel = this.peerConnection!.createDataChannel('game', {
      ordered: true
    });
    this.setupDataChannel();

    // Create and send offer
    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);
    this.sendSignalingData({ type: 'offer', data: offer });

    return gameCode;
  }

  /**
   * Join an existing game as guest
   */
  async joinGame(gameCode: string): Promise<void> {
    this.role = 'guest';
    this.gameCode = gameCode.toUpperCase();
    
    this.setupSignaling(this.gameCode);
    this.createPeerConnection();

    // Check for existing host signal in localStorage
    const existingSignal = localStorage.getItem(`attax_signal_${this.gameCode}`);
    if (existingSignal) {
      try {
        const data = JSON.parse(existingSignal);
        if (data.from === 'host' && data.signal) {
          await this.handleSignalingMessage(data.signal);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  /**
   * Send a message to the connected peer
   */
  send(message: NetworkMessage): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
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

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
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
    this.pendingCandidates = [];
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
