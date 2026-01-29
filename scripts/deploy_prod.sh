#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DBT_DIR="$PROJECT_ROOT/dbt/ecommerce_dw"
PROFILES_DIR="$PROJECT_ROOT/dbt"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
else
    echo "ERROR: .env file not found at $PROJECT_ROOT/.env"
    exit 1
fi

echo "=========================================="
echo "  E-Commerce Analytics - Production Deploy"
echo "=========================================="
echo ""
echo "Database: ECOMMERCE_PROD"
echo "Profiles: $PROFILES_DIR"
echo ""

# Confirm before proceeding
read -p "Deploy to PRODUCTION? (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 0
fi

cd "$DBT_DIR"

echo ""
echo "[1/3] Installing dbt dependencies..."
dbt deps --profiles-dir "$PROFILES_DIR"

echo ""
echo "[2/3] Running dbt models (target: prod)..."
dbt run --target prod --profiles-dir "$PROFILES_DIR"

echo ""
echo "[3/3] Running dbt tests (target: prod)..."
dbt test --target prod --profiles-dir "$PROFILES_DIR"

echo ""
echo "=========================================="
echo "  Production deploy complete!"
echo "=========================================="
