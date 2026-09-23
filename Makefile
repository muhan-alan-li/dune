# Dune: Imperium Online - development tasks.
# Run `make help` to list the targets.

SHELL := /bin/bash
.DEFAULT_GOAL := help

NPM ?= npm
PORT ?= 3000
CLIENT_PORT ?= 5173
HOST ?= 0.0.0.0
API_URL ?= http://localhost:$(PORT)

# Keep the two dev servers in one process group so Ctrl-C stops both.
.PHONY: help install build typecheck test check backend frontend dev stop clean

help: ## Show this help.
	@echo "Dune: Imperium Online"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'
	@echo ""
	@echo "Variables: PORT=$(PORT) CLIENT_PORT=$(CLIENT_PORT) HOST=$(HOST) API_URL=$(API_URL)"

install: ## Install workspace dependencies.
	$(NPM) install

build: ## Build the shared package, the server, and the client.
	$(NPM) run build

typecheck: ## Typecheck every package.
	$(NPM) run typecheck

test: ## Run all tests.
	$(NPM) run test

check: typecheck test ## Run typecheck and tests.

backend: install ## Start the backend on PORT (default 3000).
	@echo "Backend: http://localhost:$(PORT)"
	PORT=$(PORT) HOST=$(HOST) $(NPM) start --workspace @dune/server

frontend: install ## Start the frontend on CLIENT_PORT (default 5173).
	@echo "Frontend: http://localhost:$(CLIENT_PORT)"
	VITE_API_URL=$(API_URL) $(NPM) run dev --workspace @dune/client -- --port $(CLIENT_PORT)

# Start the backend and the frontend together. `scripts/dev.sh` runs both
# servers, writes logs to $(RUN_DIR), and stops them on Ctrl-C. Use `make stop`
# to stop them from another terminal.
RUN_DIR ?= .dune-dev
DEV_ENV = PORT=$(PORT) CLIENT_PORT=$(CLIENT_PORT) HOST=$(HOST) API_URL=$(API_URL) NPM=$(NPM)
dev: install ## Start the backend and the frontend together (Ctrl-C stops both).
	@$(DEV_ENV) ./scripts/dev.sh

stop: ## Stop the dev servers for the configured ports.
	@PORT=$(PORT) CLIENT_PORT=$(CLIENT_PORT) ./scripts/stop.sh

clean: ## Remove build output and dependencies.
	rm -rf node_modules server/node_modules client/node_modules shared/node_modules
	rm -rf server/dist client/dist shared/dist
	@echo "Removed build output and dependencies."
