#!/usr/bin/env bash
#
# Stop the development servers started by scripts/dev.sh.
#
# It finds the processes that listen on the backend and frontend ports, then
# terminates them. It never signals the invoking shell.
#
# Environment:
#   PORT         backend port (default 3000)
#   CLIENT_PORT  frontend port (default 5173)

set -uo pipefail

PORT="${PORT:-3000}"
CLIENT_PORT="${CLIENT_PORT:-5173}"

listener_pids() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true
  elif command -v fuser >/dev/null 2>&1; then
    fuser "${port}/tcp" 2>/dev/null | tr -s ' ' '\n' | grep -E '^[0-9]+$' || true
  fi
}

stop_port() {
  local port="$1"
  local pids
  pids="$(listener_pids "${port}")"
  if [ -z "${pids}" ]; then
    return 0
  fi
  echo "Stopping listeners on port ${port}: ${pids}"
  # shellcheck disable=SC2086
  kill -TERM ${pids} 2>/dev/null || true
  sleep 0.5
  # Force-kill anything that ignored SIGTERM.
  pids="$(listener_pids "${port}")"
  if [ -n "${pids}" ]; then
    # shellcheck disable=SC2086
    kill -KILL ${pids} 2>/dev/null || true
  fi
}

stop_port "${CLIENT_PORT}"
stop_port "${PORT}"

# Also stop npm-wrapped processes that may have lost their listener.
pkill -f "vite.*--port ${CLIENT_PORT}" >/dev/null 2>&1 || true
pkill -f "workspace @dune/server" >/dev/null 2>&1 || true

echo "Stopped dev servers on ports ${PORT} and ${CLIENT_PORT}."
