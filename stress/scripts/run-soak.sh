#!/bin/bash
# stress/scripts/run-soak.sh
# 60-minute soak test with mixed traffic

set -e

BASE_URL="${BASE_URL:-http://localhost:3001/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@restaurant.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-password}"
SOAK_VUS="${SOAK_VUS:-10}"
K6_DURATION="${K6_DURATION:-60m}"

export BASE_URL ADMIN_EMAIL ADMIN_PASSWORD SOAK_VUS K6_DURATION

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_DIR="$SCRIPT_DIR/../reports"
mkdir -p "$REPORT_DIR"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M)
OUT_FILE="$REPORT_DIR/$TIMESTAMP-soak.json"

echo "=== Soak Test (60m) ==="
echo "  BASE_URL : $BASE_URL"
echo "  VUs      : $SOAK_VUS"
echo "  Duration : $K6_DURATION"

k6 run \
  --out json="$OUT_FILE" \
  --duration "$K6_DURATION" \
  "$SCRIPT_DIR/../k6/soak-mixed.js"

EXIT=$?

if [ $EXIT -eq 0 ]; then
  echo "✅ Soak test PASSED"
else
  echo "❌ Soak test FAILED (exit $EXIT)"
fi

echo ""
echo "Report: $OUT_FILE"

# Post-test DB integrity check
if command -v mysql &>/dev/null; then
  echo ""
  echo "=== Running DB integrity checks ==="
  MYSQL_PWD="${MYSQL_PASSWORD:-}" mysql -u root -p"$MYSQL_PWD" packing_list < "$SCRIPT_DIR/../sql/integrity-checks.sql"
fi

exit $EXIT