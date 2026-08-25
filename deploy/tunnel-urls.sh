#!/usr/bin/env bash
# Print the Cloudflare quick-tunnel URL currently in use by each pm2 tunnel.
#
# Quick-tunnel hostnames are ephemeral — cloudflared is assigned a new one on
# every restart — so this reads the most recent URL out of each tunnel's log
# rather than any stored value.
set -euo pipefail
logs="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/logs"

latest_url() {
  grep -ho 'https://[a-z0-9-]*\.trycloudflare\.com' "$1" 2>/dev/null | tail -1
}

printf '%-14s %s\n' "API (:5000)"   "$(latest_url "$logs/tunnel-api.log")"
printf '%-14s %s\n' "Admin (:3000)" "$(latest_url "$logs/tunnel-admin.log")"
