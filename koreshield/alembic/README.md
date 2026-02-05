"""
Database Migration Scripts
==========================

This directory contains Alembic migration scripts for KoreShield.

## Quick Start

### 1. Install Alembic
```bash
pip install alembic asyncpg psycopg2-binary
```

### 2. Set DATABASE_URL
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
```

### 3. Run Migrations
```bash
cd koreshield
alembic upgrade head
```

## Development Workflow

### Create a New Migration
When you modify models in `tenant_models.py`:
```bash
alembic revision --autogenerate -m "description of changes"
```

### Apply Migrations
```bash
alembic upgrade head
```

### Rollback Migrations
```bash
alembic downgrade -1  # Rollback one migration
alembic downgrade base  # Rollback all migrations
```

### Check Current Version
```bash
alembic current
```

### View Migration History
```bash
alembic history --verbose
```

## Railway Deployment

Migrations will run automatically on Railway deployment if you add this to your start command:

```bash
alembic upgrade head && uvicorn src.koreshield.main:app --host 0.0.0.0 --port 8000
```

Or create a Procfile:
```
release: cd koreshield && alembic upgrade head
web: uvicorn src.koreshield.main:app --host 0.0.0.0 --port $PORT
```

## Notes

- The `versions/` directory contains all migration scripts
- Migrations are applied in sequential order
- Always review auto-generated migrations before applying
- Test migrations on a development database first
