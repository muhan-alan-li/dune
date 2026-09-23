# Dune

A online version of Dune: Imperium, the board game. Contains only the base game for now.

## Quickstart

This project uses Node 22 or a later version. Use npm workspaces.

### Make targets

A `Makefile` starts both servers for local development.

```bash
make help       # list all targets
make dev        # start the backend and the frontend together
make stop       # stop the dev servers
make install    # install workspace dependencies
make test       # run all tests
make typecheck  # typecheck every package
make build      # build every package
make clean      # remove build output and dependencies
```

`make dev` starts the backend on port 3000 and the frontend on port 5173.
Override the ports on the command line:

```bash
make dev PORT=4000 CLIENT_PORT=8080
```

Press Ctrl-C to stop both servers.
Logs are written to `.dune-dev/backend.log` and `.dune-dev/frontend.log`.

### Manual start

Run these commands if you do not use Make.

#### 1. Install

Run this command one time at the repository root:

```bash
npm install
```

#### 2. Start the server

Build the shared package and the server, then start the server:

```bash
npm run build
npm start --workspace @dune/server
```

The server listens on port 3000 by default.
Set `PORT` to use a different port:

```bash
PORT=4000 npm start --workspace @dune/server
```

#### 3. Start the client

Open a second terminal.
Point the client at the server, then start the Vite development server:

```bash
VITE_API_URL=http://localhost:3000 npm run dev --workspace @dune/client
```

Open `http://localhost:5173` in a browser.

If the server uses a different port, change `VITE_API_URL` to match.

### 4. Play a local game

The game needs 3 or 4 players.
Open the client in 3 or 4 browser windows or devices on the same network.

1. In the first window, select a display name and create a lobby.
2. In each other window, select a display name and join with the lobby code.
3. As host, set the color and the leader of each player.
4. Each player selects Ready.
5. The host starts the game.

## Development commands

Run these commands at the repository root, or use the matching Make target:

```bash
npm test            # build shared, then run all tests
npm run typecheck   # typecheck every package
npm run build       # build every package
```

## Project layout

```text
shared/   shared contract: types, protocol, reject codes
server/   pure rules engine, lobby, REST, and WebSocket layer
client/   React user interface
scripts/  dev and stop helper scripts
data/     base card catalogue
```

See `REQUIREMENTS.md` for user interaction, `RULEBOOK.md` for the game rules, and the architecture documents for the system design.

## Current limitations

The game is not complete. Several features are not implemented yet:

- Lobby updates use polling. Only game updates use WebSocket.
- The rulebook view is a condensed reference, not the full text.
- Leader selection uses a small client catalogue.
- Ordered Reveal effects, most Intrigue cards, Leader abilities, the Swordmaster, the Mentat, and complex Conflict rewards are not available.
- The card data still has unverified values.
