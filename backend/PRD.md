# Product Requirements Document (PRD)
## Project: TicTacToe Multiplayer Backend
## Stack: Node.js, Express, MongoDB, Socket.io

---

## 1. Objective

Build a backend system that enables real-time multiplayer TicTacToe gameplay using:

- Google Authentication (no passwords)
- Invite-based session system
- WebSocket-based real-time synchronization
- Persistent game state storage

The backend must act as the **single source of truth** for all multiplayer games.

---

## 2. Core Features

### 2.1 Authentication
- Users authenticate via Google Sign-In
- Backend verifies Google `id_token`
- User data is stored or updated in MongoDB
- No password handling

---

### 2.2 Session Management
- A user can create a game session (host)
- A second user can join via invite link
- Each session has a unique ID
- Session states:
  - `waiting`
  - `active`
  - `finished`

---

### 2.3 Real-Time Gameplay
- WebSocket connection using Socket.io
- Players join a shared room based on session ID
- Server processes all moves
- Server broadcasts updated game state

---

### 2.4 Game State Management
- Server maintains:
  - Board state (9 cells)
  - Current turn
  - Players (host, guest)
  - Winner / draw state
- All moves must be validated server-side

---

## 3. Functional Requirements

### 3.1 Auth Flow
1. Frontend sends Google `id_token`
2. Backend verifies token
3. Backend creates/updates user
4. Backend returns user data

---

### 3.2 Session Flow

#### Create Session
- Endpoint: `POST /session/create`
- Input: authenticated user
- Output: session ID

#### Join Session
- Endpoint: `POST /session/join`
- Input: session ID
- Output: updated session

#### Get Session
- Endpoint: `GET /session/:id`
- Output: full session state

---

### 3.3 Socket Flow

#### Join Room
- Event: `join_room`
- Payload: `{ sessionId }`

#### Player Move
- Event: `player_move`
- Payload: `{ sessionId, cellIndex }`

#### Server Broadcast
- `player_joined`
- `game_update`
- `game_over`

---

## 4. Data Models

### User
```json
{
  "_id": "uuid",
  "google_id": "string",
  "email": "string",
  "name": "string",
  "avatar_url": "string",
  "created_at": "timestamp"
}
Session
{
  "_id": "string",
  "host_id": "string",
  "guest_id": "string | null",

  "board": ["", "", "", "", "", "", "", "", ""],
  "current_turn": "X",

  "status": "waiting | active | finished",
  "winner": "X | O | draw | null",

  "created_at": "timestamp",
  "updated_at": "timestamp"
}
5. Non-Functional Requirements
Low latency for real-time gameplay
Secure token verification
Prevent invalid or duplicate moves
Scalable socket handling
Clean separation of concerns
6. Constraints
No traditional authentication (Google only)
No image uploads (use Google avatar URLs)
No AI gameplay logic on backend
Backend must not trust frontend state
7. Success Criteria
Two users can connect via invite link
Moves sync instantly between players
Game state remains consistent
No invalid moves are accepted
Sessions transition correctly between states
8. Out of Scope (for now)
Match history
Leaderboards
Chat system
Spectators