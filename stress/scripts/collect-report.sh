#!/bin/bash
# stress/scripts/collect-report.sh
# Parse all JSON reports in stress/reports/ and print a markdown summary table.
# Run after running any stress test batch.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_DIR="$SCRIPT_DIR/../reports"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M)

echo "# Stress Test Report — $TIMESTAMP"
echo ""
echo "## Environment"
echo ""
echo "| Variable | Value |"
echo "|----------|-------|"
echo "| BASE_URL | ${BASE_URL:-http://localhost:3001/api} |"
echo "| ADMIN_EMAIL | ${ADMIN_EMAIL:-admin@restaurant.com} |"
echo ""
echo "## Results"
echo ""
echo "| Test | Verdict | p95 (ms) | Error Rate | Details |"
echo "|------|---------|----------|-----------|---------|"

for json in "$REPORT_DIR"/*.json; do
  [ -f "$json" ] || continue

  TEST_NAME=$(basename "$json" .json | sed 's/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}_[0-9]\{2\}-[0-9]\{2\}//' | sed 's/^-//')

  # Try to extract verdict from k6 JSON output (summary block)
  VERDICT=$(grep -o '"verdict":"[^"]*"' "$json" 2>/dev/null | head -1 | sed 's/.*"verdict":"//;s/"//')
  P95=$(grep -o '"p(95)":[0-9.]*' "$json" 2>/dev/null | head -1 | sed 's/.*"p(95)":"*//')
  ERR_RATE=$(grep -o '"http_req_failed":{[^}]*}' "$json" 2>/dev/null | grep -o '"rate":[0-9.]*' | sed 's/"rate"://')

  # Fallback: check for PASS/FAIL in file
  if [ -z "$VERDICT" ]; then
    if grep -q '"verdict":"PASS"' "$json" 2>/dev/null; then
      VERDICT="PASS"
    elif grep -q '"verdict":"FAIL"' "$json" 2>/dev/null; then
      VERDICT="FAIL"
    else
      VERDICT=$(grep -oE '"http_req_failed":\{"rate":[0-9.]+' "$json" | grep -oE '[0-9.]+$' )
      VERDICT="${VERDICT:-UNKNOWN}"
    fi
  fi

  EMOJI="❓"
  case "$VERDICT" in
    PASS) EMOJI="✅";;
    FAIL) EMOJI="❌";;
  esac

  echo "| $TEST_NAME | $EMOJI $VERDICT | $P95 | $ERR_RATE | $(basename "$json") |"
done

echo ""
echo "## Files"
echo ""
ls -lh "$REPORT_DIR"/*.json 2>/dev/null | awk '{print "| " $9 " | " $5 " |"}'

echo ""
echo "*Generated: $(date)*"