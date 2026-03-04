#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${GENOMA_IMAGE:-${GENOMA_IMAGE:-genoma:local}}"
CONFIG_DIR="${GENOMA_CONFIG_DIR:-${GENOMA_CONFIG_DIR:-$HOME/.genoma}}"
WORKSPACE_DIR="${GENOMA_WORKSPACE_DIR:-${GENOMA_WORKSPACE_DIR:-$HOME/.genoma/workspace}}"
PROFILE_FILE="${GENOMA_PROFILE_FILE:-${GENOMA_PROFILE_FILE:-$HOME/.profile}}"

PROFILE_MOUNT=()
if [[ -f "$PROFILE_FILE" ]]; then
  PROFILE_MOUNT=(-v "$PROFILE_FILE":/home/node/.profile:ro)
fi

echo "==> Build image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" -f "$ROOT_DIR/Dockerfile" "$ROOT_DIR"

echo "==> Run gateway live model tests (profile keys)"
docker run --rm -t \
  --entrypoint bash \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e HOME=/home/node \
  -e NODE_OPTIONS=--disable-warning=ExperimentalWarning \
  -e GENOMA_LIVE_TEST=1 \
  -e GENOMA_LIVE_GATEWAY_MODELS="${GENOMA_LIVE_GATEWAY_MODELS:-${GENOMA_LIVE_GATEWAY_MODELS:-modern}}" \
  -e GENOMA_LIVE_GATEWAY_PROVIDERS="${GENOMA_LIVE_GATEWAY_PROVIDERS:-${GENOMA_LIVE_GATEWAY_PROVIDERS:-}}" \
  -e GENOMA_LIVE_GATEWAY_MAX_MODELS="${GENOMA_LIVE_GATEWAY_MAX_MODELS:-${GENOMA_LIVE_GATEWAY_MAX_MODELS:-24}}" \
  -e GENOMA_LIVE_GATEWAY_MODEL_TIMEOUT_MS="${GENOMA_LIVE_GATEWAY_MODEL_TIMEOUT_MS:-${GENOMA_LIVE_GATEWAY_MODEL_TIMEOUT_MS:-}}" \
  -v "$CONFIG_DIR":/home/node/.genoma \
  -v "$WORKSPACE_DIR":/home/node/.genoma/workspace \
  "${PROFILE_MOUNT[@]}" \
  "$IMAGE_NAME" \
  -lc "set -euo pipefail; [ -f \"$HOME/.profile\" ] && source \"$HOME/.profile\" || true; cd /app && pnpm test:live"
