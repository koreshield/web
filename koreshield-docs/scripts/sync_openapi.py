#!/usr/bin/env python3
"""Generate koreshield-docs/static/openapi.json from the backend FastAPI app."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SERVER_ROOT = REPO_ROOT / "koreshield"
SERVER_SRC = SERVER_ROOT / "src"
CONFIG_PATH = SERVER_ROOT / "config" / "config.yaml"
OUT_PATH = REPO_ROOT / "koreshield-docs" / "static" / "openapi.json"


def main() -> int:
    # Safe defaults for local/doc generation only.
    os.environ.setdefault("JWT_SECRET", "dev-jwt-secret-with-minimum-32-characters!!")
    os.environ.setdefault("JWT_ISSUER", "koreshield-auth")
    os.environ.setdefault("JWT_AUDIENCE", "koreshield-api")
    os.environ.setdefault("KORESHIELD_EAGER_APP_INIT", "false")

    sys.path.insert(0, str(SERVER_SRC))

    from koreshield.proxy import create_app  # pylint: disable=import-outside-toplevel

    app = create_app(str(CONFIG_PATH))
    spec = app.openapi()

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(spec, indent=2) + "\n", encoding="utf-8")

    print(f"Synced OpenAPI: {OUT_PATH} ({len(spec.get('paths', {}))} paths)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
