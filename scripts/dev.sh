#!/usr/bin/env bash
#
# Start the backend and the frontend for local development.
#
# Ctrl-C stops both servers. Shutdown is done by port, so it works even when
# npm starts the servers in their own process groups. Logs go to .dune-dev/.
#
# Environment:
#   PORT         backend port (default 3000)
#   CLIENT_PORT  frontend port (default 5173)
#   HOST         backend host (default 0.0.0.0)
#   API_URL      frontend -> backend base URL (default http://localhost:PORT)
#   NPM          npm command (default npm)

set -uo pipefail

PORT="${PORT:-3000}"
CLIENT_PORT="${CLIENT_PORT:-5173}"
HOST="${HOST:-0.0.0.0}"
API_URL="${API_URL:-http://localhost:${PORT}}"
NPM="${NPM:-npm}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="${REPO_ROOT}/.dune-dev"
mkdir -p "${RUN_DIR}"

cd "${REPO_ROOT}"

kill_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
    # shellcheck disable=SC2086
    [ -n "${pids}" ] && kill -TERM ${pids} 2>/dev/null || true
  fi
}

cleanup() {
  trap - EXIT INT TERM
  echo
  echo "Stopping dev servers on ports ${PORT} and ${CLIENT_PORT}..."
  kill_port "${CLIENT_PORT}"
  kill_port "${PORT}"
  sleep 0.5
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -tiTCP:"${CLIENT_PORT}" -tiTCP:"${PORT}" -sTCP:LISTEN 2>/dev/null || true)"
    # shellcheck disable=SC2086
    [ -n "${pids}" ] && kill -KILL ${pids} 2>/dev/null || true
  fi
  pkill -f "vite.*--port ${CLIENT_PORT}" >/dev/null 2>&1 || true
  pkill -f "workspace @dune/server" >/dev/null 2>&1 || true
  echo "Stopped."
}
trap cleanup EXIT INT TERM

# Stop any stale servers from a previous run before starting.
kill_port "${CLIENT_PORT}"
kill_port "${PORT}"

env PORT="${PORT}" HOST="${HOST}" "${NPM}" start --workspace @dune/server \
  > "${RUN_DIR}/backend.log" 2>&1 &
BACKEND_PID=$!

env API_URL="${API_URL}" "${NPM}" run dev --workspace @dune/client -- --port "${CLIENT_PORT}" \
  > "${RUN_DIR}/frontend.log" 2>&1 &
FRONTEND_PID=$!

echo "Backend:  http://localhost:${PORT}  (log: ${RUN_DIR}/backend.log)"
echo "Frontend: http://localhost:${CLIENT_PORT}  (log: ${RUN_DIR}/frontend.log)"
echo "Press Ctrl-C to stop both."

# Poll both children so that SIGINT and SIGTERM are handled promptly.
# `wait -n` can delay trap handling in a non-interactive shell.
while kill -0 "${BACKEND_PID}" 2>/dev/null && kill -0 "${FRONTEND_PID}" 2>/dev/null; do
  sleep 0.5
done

echo "A dev server stopped. Shutting down both."
