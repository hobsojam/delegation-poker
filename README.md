# Delegation Poker

A multiplayer web tool for the Management 3.0 Delegation Poker exercise. Players simultaneously vote on the appropriate delegation level for a given decision, then discuss the result as a group.

## What is Delegation Poker?

Delegation Poker is a team exercise for agreeing on how much authority a manager should delegate for specific decisions. Rather than a blanket "you're empowered" or "ask me first," it creates a shared, explicit understanding of delegation on a decision-by-decision basis.

Each player independently picks one of seven delegation levels. The facilitator reveals all votes simultaneously — if there's no consensus, the spread of answers drives the conversation.

## The 7 delegation levels

| Level | Name | Meaning |
|---|---|---|
| 1 | Tell | I will tell them |
| 2 | Sell | I will try to sell it to them |
| 3 | Consult | I will consult and then decide |
| 4 | Agree | We will agree together |
| 5 | Advise | I will advise but they decide |
| 6 | Inquire | I will inquire after they decide |
| 7 | Delegate | I will fully delegate to them |

## How it works

**Lobby**

The facilitator creates a session and shares the 4-letter code with participants. Anyone can join by entering the code and a display name. The facilitator optionally enters a scenario (the decision to discuss) before starting the round.

**Voting**

All participants see the scenario and independently select a delegation level. Vote choices are hidden from other players — they only see who has and hasn't voted yet.

**Reveal**

The facilitator reveals all votes simultaneously. If every player picked the same level, consensus is confirmed. If not, the spread is shown and the group discusses. The facilitator can run another vote on the same scenario (Play Again) or move to a new one.

Round history is preserved across multiple rounds. Clicking a past round in the header reopens a summary of that round's votes.

## Running locally

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Start the server (terminal 1)
cd server && npm start

# Start the client dev server (terminal 2)
cd client && npm run dev
```

Open `http://localhost:5173` in a browser. Create a session and share the 4-letter code with other participants — they can join from the same URL on any device on the same network, or from `http://localhost:5173` in another tab.

For testing across two real devices, the Vite dev server proxy only works on the local machine. Use Docker instead:

```bash
docker compose up --build
```

Then open `http://<your-machine-ip>:3000` on all devices.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js 26, Express 5, `ws` |
| Frontend | Svelte 5 (compiled to static files, served by Express) |
| Real-time | WebSockets (single port, no Socket.io) |
| Deployment | Docker (single container, single port) |
| ID generation | `crypto.randomUUID()` / `uuid` |

No external services. No database. Session state is in-memory and lost on server restart — acceptable for live facilitated sessions.

## Architecture

```
┌─────────────────────────────────────┐
│            Docker Container         │
│                                     │
│  Express (HTTP + static files)      │
│    ├── POST /api/sessions           │
│    ├── GET  /api/sessions/:id       │
│    ├── GET  /health                 │
│    └── WS upgrade  → ws server     │
│                                     │
│  In-memory session state            │
│    └── Map<sessionId, Session>      │
└─────────────────────────────────────┘
```

The Svelte app is compiled at Docker image build time and served as static files. WebSocket connections share the same HTTP port via an HTTP upgrade. There is no separate WebSocket port.

### Session phases

Sessions move through three phases: `lobby` → `playing` → `revealed`. The facilitator controls all transitions. `play_again` returns to `playing` on the same scenario; `reset` returns to `lobby` and clears history.

### State sanitisation

The server broadcasts different state per participant per phase:

- **lobby** — participant names and roles only; no vote data
- **playing** — each participant sees only their own vote (`myChoice`); others show only whether they have voted (`hasVoted`)
- **revealed** — all votes visible to everyone

### WebSocket message protocol

All messages are JSON. Direction noted as C→S (client to server) or S→C (server to client).

| Message | Direction | Description |
|---|---|---|
| `join` | C→S | Join session: `{ name, isFacilitator }` |
| `start_round` | C→S | Facilitator starts a round: `{ scenario }` |
| `vote` | C→S | Cast a vote: `{ level }` (1–7) |
| `reveal` | C→S | Facilitator reveals all votes |
| `save_decision` | C→S | Facilitator saves or updates the final decision for a revealed round: `{ round, level, notes }` |
| `play_again` | C→S | Facilitator reruns the same scenario |
| `reset` | C→S | Facilitator resets to lobby, clears history |
| `leave` | C→S | Sent automatically on disconnect to remove the participant |
| `state` | S→C | Full sanitised session state broadcast to all participants |
| `error` | S→C | `{ code, message }` |

Saved decisions are stored on round history entries and can be exported from the results screen as a single A4 or A3 PNG poster for the whole session.

## Deploying

A Render free-tier deployment is defined by `render.yaml`: in Render choose New → Blueprint, select this repo, and confirm. Merges to `master` auto-deploy. Note the free tier spins down after a quiet period, so the first load can take ~30–60 seconds.

The Docker image is otherwise self-contained and runs on any platform that supports Node.js 26 or Docker (Railway, Fly.io, or similar):

```bash
docker build -t delegation-poker .
docker run -p 3000:3000 delegation-poker
```

Set the `PORT` environment variable if the platform requires it (most do this automatically), and `TRUST_PROXY=true` behind a TLS-terminating proxy so rate limiting sees real client IPs. No external services required.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP and WebSocket port |
| `STATIC_DIR` | `./public` | Built client files |
| `SESSION_TTL_HOURS` | `24` | Hours of inactivity before a session expires |
| `TRUST_PROXY` | `false` | Trust `X-Forwarded-For` headers (set `true` behind a reverse proxy) |
| `WS_CONNECTION_LIMIT_PER_IP` | `10` | Max concurrent WebSocket connections per IP |
| `API_RATE_LIMIT_MAX` | `100` | HTTP API requests allowed per IP per 15 minutes |
| `SESSION_RATE_LIMIT_MAX` | `20` | Session creations allowed per IP per hour |

## License

MIT © 2026 James Hobson
