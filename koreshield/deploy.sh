#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"
ENV_FILE="$ROOT_DIR/.env"

usage() {
  cat <<'EOF'
Usage: koreshield/deploy.sh [check|up|down|restart|logs]

Commands:
  check    Verify Docker and the expected root files exist
  up       Start or rebuild the production-style local stack
  down     Stop the stack
  restart  Rebuild and restart the stack
  logs     Tail API and web logs
EOF
}

check_dependencies() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required."
    exit 1
  fi

  if [ ! -f "$COMPOSE_FILE" ]; then
    echo "Missing compose file: $COMPOSE_FILE"
    exit 1
  fi

  if [ ! -f "$ENV_FILE" ]; then
    echo "Missing root env file: $ENV_FILE"
    exit 1
  fi
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

case "${1:-check}" in
  check)
    check_dependencies
    echo "KoreShield deployment prerequisites look good."
    ;;
  up)
    check_dependencies
    compose up -d --build
    ;;
  down)
    check_dependencies
    compose down
    ;;
  restart)
    check_dependencies
    compose up -d --build
    ;;
  logs)
    check_dependencies
    compose logs -f api web
    ;;
  *)
    usage
    exit 1
    ;;
esac
