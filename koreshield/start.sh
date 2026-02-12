#!/bin/bash
set -e

echo "🔧 Running database migrations..."
cd /app/koreshield && alembic upgrade head

echo "🚀 Starting KoreShield API..."
exec python -m uvicorn src.koreshield.main:app --host 0.0.0.0 --port ${PORT:-8000}
