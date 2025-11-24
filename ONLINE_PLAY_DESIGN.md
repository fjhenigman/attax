# Online Two-Person Play Design Document

## Overview

This document outlines the technical design for adding online two-person play to Attax. Players will be able to create and join game sessions over the internet, playing against remote opponents in real-time.

---

## Goals

1. **Real-time Gameplay**: Moves should propagate between players with minimal latency
2. **Session Management**: Players can create, share, and join game sessions
3. **Reconnection Support**: Handle network interruptions gracefully
4. **Consistency**: Game state remains synchronized between both players
5. **Security**: Prevent cheating and validate moves server-side

---

## High-Level Architecture

```
┌─────────────────────┐           ┌─────────────────────┐
│      Player 1       │           │      Player 2       │
│   ┌─────────────┐   │           │   ┌─────────────┐   │
│   │   Browser   │   │           │   │   Browser   │   │
│   │  ┌───────┐  │   │           │   │  ┌───────┐  │   │
│   │  │ Redux │  │   │           │   │  │ Redux │  │   │
│   │  │ Store │  │   │           │   │  │ Store │  │   │
│   │  └───────┘  │   │           │   │  └───────┘  │   │
│   │      │      │   │           │   │      │      │   │
│   │  ┌───────┐  │   │           │   │  ┌───────┐  │   │
│   │  │WebSocket│ │   │           │   │  │WebSocket│ │   │
│   │  │ Client │  │   │           │   │  │ Client │  │   │
│   │  └───────┘  │   │           │   │  └───────┘  │   │
│   └──────│──────┘   │           │   └──────│──────┘   │
└──────────│──────────┘           └──────────│──────────┘
           │                                 │
           └──────────┐       ┌──────────────┘
                      │       │
                      ▼       ▼
              ┌───────────────────┐
              │   Game Server     │
              │  ┌─────────────┐  │
              │  │  Session    │  │
              │  │  Manager    │  │
              │  └─────────────┘  │
              │  ┌─────────────┐  │
              │  │   Game      │  │
              │  │  Validator  │  │
              │  └─────────────┘  │
              │  ┌─────────────┐  │
              │  │  WebSocket  │  │
              │  │   Server    │  │
              │  └─────────────┘  │
              └───────────────────┘
```

---

## Communication Protocol

### Transport Layer

**WebSocket** is chosen for real-time bidirectional communication:

- **Low Latency**: Persistent connection eliminates HTTP overhead
- **Real-time Updates**: Server can push state changes immediately
- **Wide Support**: Available in all modern browsers
- **Fallback**: Can degrade to HTTP long-polling if needed

### Message Format

All messages use JSON format for simplicity and debuggability.

#### Base Message Structure

```typescript
interface Message {
  type: string;
  timestamp: number;
  payload: unknown;
}
```

#### Client-to-Server Messages

| Type | Payload | Description |
|------|---------|-------------|
| `CREATE_SESSION` | `{ playerName: string }` | Create a new game session |
| `JOIN_SESSION` | `{ sessionId: string, playerName: string }` | Join an existing session |
| `MAKE_MOVE` | `{ from: Position, to: Position }` | Submit a move |
| `REQUEST_REMATCH` | `{}` | Request to play again |
| `LEAVE_SESSION` | `{}` | Leave the current session |
| `PING` | `{}` | Keep connection alive |

#### Server-to-Client Messages

| Type | Payload | Description |
|------|---------|-------------|
| `SESSION_CREATED` | `{ sessionId: string, shareCode: string }` | Session created successfully |
| `SESSION_JOINED` | `{ sessionId: string, opponent: string, playerColor: Player }` | Joined session |
| `GAME_START` | `{ gameState: GameState, yourColor: Player }` | Game is starting |
| `MOVE_MADE` | `{ move: Move, newState: GameState }` | A move was made |
| `MOVE_REJECTED` | `{ reason: string }` | Move was invalid |
| `OPPONENT_DISCONNECTED` | `{}` | Opponent lost connection |
| `OPPONENT_RECONNECTED` | `{}` | Opponent reconnected |
| `GAME_OVER` | `{ winner: Player \| 'draw', finalState: GameState }` | Game finished |
| `REMATCH_REQUESTED` | `{ by: Player }` | Opponent wants rematch |
| `ERROR` | `{ code: string, message: string }` | Error occurred |
| `PONG` | `{}` | Response to ping |

---

## Session Management

### Session Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   WAITING   │────▶│   PLAYING   │────▶│  FINISHED   │
│ (1 player)  │     │ (2 players) │     │ (game over) │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │                   │                   │
      ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  ABANDONED  │     │   PAUSED    │     │   CLOSED    │
│ (timeout)   │     │(disconnect) │     │ (cleanup)   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Session States

| State | Description |
|-------|-------------|
| `WAITING` | Session created, waiting for second player |
| `PLAYING` | Both players connected, game in progress |
| `PAUSED` | One player disconnected, waiting for reconnection |
| `FINISHED` | Game completed, awaiting rematch or close |
| `ABANDONED` | Session timed out without second player |
| `CLOSED` | Session terminated and cleaned up |

### Share Codes

Sessions are identified by a human-readable share code for easy sharing:

- **Format**: 6 alphanumeric characters (e.g., `ABC123`)
- **Case-insensitive**: For ease of verbal communication
- **Expiration**: Codes expire after session ends or timeout

---

## Game State Synchronization

### Source of Truth

The **server maintains authoritative game state**. Client state is derived from server messages.

### Synchronization Flow

1. Player submits move via `MAKE_MOVE` message
2. Server validates move against current state
3. If valid: Server updates state, broadcasts `MOVE_MADE` to both clients
4. If invalid: Server sends `MOVE_REJECTED` to submitting client
5. Clients update local Redux store from server state

### Optimistic Updates

For better UX, clients may apply moves optimistically:

1. Client applies move locally immediately
2. Client sends move to server
3. If server rejects: Client reverts to server state
4. If server accepts: Client state already matches

### Conflict Resolution

In case of state divergence:
- Server state always wins
- Clients receive full game state in `MOVE_MADE` messages
- Clients must replace local state with server state

---

## Client-Side Architecture

### New Components

#### NetworkManager

Handles WebSocket connection and message routing.

```typescript
class NetworkManager {
  private socket: WebSocket | null;
  private sessionId: string | null;
  
  connect(serverUrl: string): Promise<void>;
  disconnect(): void;
  
  createSession(playerName: string): Promise<SessionInfo>;
  joinSession(shareCode: string, playerName: string): Promise<SessionInfo>;
  
  sendMove(move: Move): void;
  requestRematch(): void;
  
  onMessage(handler: (message: Message) => void): void;
  onDisconnect(handler: () => void): void;
  onReconnect(handler: () => void): void;
}
```

#### Redux Integration

New Redux slice for network state:

```typescript
interface NetworkState {
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  sessionId: string | null;
  shareCode: string | null;
  playerColor: Player | null;
  opponentName: string | null;
  opponentConnected: boolean;
  error: string | null;
}
```

New actions:

- `CONNECT_TO_SERVER`
- `CONNECTION_ESTABLISHED`
- `CONNECTION_LOST`
- `SESSION_CREATED`
- `SESSION_JOINED`
- `OPPONENT_CONNECTED`
- `OPPONENT_DISCONNECTED`
- `RECEIVE_GAME_STATE`

#### Network Middleware

Redux middleware that:
- Intercepts local game actions (e.g., `MAKE_MOVE`)
- Sends corresponding messages to server
- Dispatches actions from incoming server messages

```typescript
const networkMiddleware: Middleware = (store) => (next) => (action) => {
  // For online games, send moves to server instead of applying locally
  if (action.type === 'MAKE_MOVE' && store.getState().network.sessionId) {
    networkManager.sendMove(action.payload);
    return; // Don't apply locally; wait for server confirmation
  }
  return next(action);
};
```

### UI Changes

#### Game Mode Selection

New screen to choose:
- **Local Play**: Current behavior (two players, one device)
- **Create Online Game**: Start new session, get share code
- **Join Online Game**: Enter share code to join

#### Online Game Lobby

Shows:
- Share code (for session creator)
- Waiting for opponent indicator
- Cancel button

#### Online Game UI

Additional elements:
- Opponent name display
- Connection status indicator
- "Opponent's turn" / "Your turn" indicator
- Reconnection overlay when opponent disconnects

---

## Server-Side Architecture

### Technology Recommendations

| Component | Recommendation | Rationale |
|-----------|---------------|-----------|
| Runtime | Node.js | Same language as client, good WebSocket support |
| WebSocket | `ws` library | Lightweight, well-maintained |
| State Storage | In-memory | Sufficient for MVP; sessions are short-lived |
| Share Codes | `nanoid` | Fast, URL-safe unique ID generation |

### Core Components

#### WebSocket Server

Handles connection lifecycle:
- Accept new connections
- Route messages to appropriate handlers
- Manage connection state
- Handle disconnections and cleanup

#### Session Manager

Manages game sessions:
- Create new sessions
- Match players to sessions via share codes
- Track session states
- Clean up expired/abandoned sessions

#### Game Validator

Reuses existing game logic to:
- Validate moves against current state
- Apply moves and compute new state
- Detect game end conditions

### Server State Structure

```typescript
interface ServerSession {
  id: string;
  shareCode: string;
  state: SessionState;
  gameState: GameState;
  players: {
    red: PlayerConnection | null;
    blue: PlayerConnection | null;
  };
  createdAt: number;
  lastActivity: number;
}

interface PlayerConnection {
  socket: WebSocket;
  name: string;
  connected: boolean;
}
```

---

## Security Considerations

### Move Validation

All moves are validated server-side:
- Verify it's the player's turn
- Verify the move is from a piece owned by the player
- Verify the destination is a valid move
- Reject invalid moves immediately

### Session Security

- Share codes are unguessable (random, sufficient entropy)
- Sessions have maximum lifetime
- Players can only interact with their own sessions

### Rate Limiting

Prevent abuse:
- Limit connection attempts per IP
- Limit messages per connection per second
- Limit concurrent sessions per IP

### Input Sanitization

- Validate all message payloads
- Reject malformed messages
- Sanitize player names for display

---

## Reconnection Handling

### Disconnect Detection

- WebSocket `close` event
- Ping/pong timeout (30 seconds without response)

### Reconnection Flow

1. Player disconnects (network issue, page refresh, etc.)
2. Server marks player as disconnected, sets reconnection timeout (2 minutes)
3. Server sends `OPPONENT_DISCONNECTED` to other player
4. Disconnected player reconnects with session ID
5. Server restores connection, sends current game state
6. Server sends `OPPONENT_RECONNECTED` to other player
7. Game resumes normally

### Session Tokens

For reconnection, clients store:
- Session ID
- Player authentication token (issued at join time)

Stored in `localStorage` for persistence across page refreshes.

---

## Error Handling

### Network Errors

| Error | Client Response |
|-------|-----------------|
| Connection failed | Show retry option, allow offline play |
| Connection lost mid-game | Show reconnecting overlay, auto-retry |
| Server error | Display error message, offer to start new game |

### Game Errors

| Error | Server Response |
|-------|-----------------|
| Invalid move | Send `MOVE_REJECTED` with reason |
| Out of turn | Send `MOVE_REJECTED` with reason |
| Session not found | Send `ERROR` with code `SESSION_NOT_FOUND` |
| Session full | Send `ERROR` with code `SESSION_FULL` |

---

## Testing Strategy

### Unit Tests

- Message serialization/deserialization
- Move validation logic
- Session state transitions
- Reconnection token handling

### Integration Tests

- Full game flow with mock WebSocket
- Reconnection scenarios
- Error handling paths

### End-to-End Tests

Using Playwright:
- Create session, join session, play complete game
- Test disconnection and reconnection
- Test rematch flow

---

## Deployment Considerations

### Server Hosting

Options for the WebSocket server:
- **Serverless**: Not ideal for WebSockets (cold starts, connection limits)
- **Container**: Good balance of control and ease (e.g., Cloud Run, ECS)
- **VPS**: Full control, manual scaling (e.g., DigitalOcean, Linode)

### Scaling

For initial launch:
- Single server instance is sufficient
- Sessions are self-contained (no cross-server state needed)

For future scaling:
- Sticky sessions route players to same server
- Redis for cross-server session state if needed

### Monitoring

Track:
- Active connections count
- Active sessions count
- Message throughput
- Error rates
- Latency percentiles

---

## Implementation Phases

### Phase 1: Core Networking

- [ ] WebSocket server setup
- [ ] Basic message protocol implementation
- [ ] Session creation and joining
- [ ] NetworkManager client class

### Phase 2: Game Synchronization

- [ ] Server-side game state management
- [ ] Move validation on server
- [ ] State synchronization protocol
- [ ] Redux network middleware

### Phase 3: UI/UX

- [ ] Game mode selection screen
- [ ] Online game lobby
- [ ] Connection status indicators
- [ ] Turn indicators for online play

### Phase 4: Robustness

- [ ] Reconnection handling
- [ ] Error handling and recovery
- [ ] Rate limiting
- [ ] Session cleanup

### Phase 5: Polish

- [ ] Rematch functionality
- [ ] Player name display
- [ ] Improved error messages
- [ ] Loading states and animations

---

## API Reference

### REST Endpoints (Optional)

For session discovery and health checks:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/sessions/:code` | GET | Check if session exists |

### WebSocket Endpoint

| Endpoint | Description |
|----------|-------------|
| `wss://server/game` | Main game WebSocket connection |

---

## Summary

This design enables online two-person play through:

1. **WebSocket communication** for real-time gameplay
2. **Server-authoritative state** for consistency and security
3. **Share codes** for easy session joining
4. **Reconnection support** for handling network issues
5. **Redux integration** maintaining existing architecture patterns

The implementation is divided into phases, starting with core networking and progressing through game synchronization, UI changes, and robustness improvements. The design reuses existing game logic for move validation, ensuring consistency between local and online play.
