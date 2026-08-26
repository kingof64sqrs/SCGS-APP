#!/usr/bin/env bash
# Print the Cloudflare quick-tunnel URL currently in use by each pm2 tunnel.
#
# Quick-tunnel hostnames are ephemeral — cloudflared is assigned a new one on
# every restart — so this reads the URL out of each tunnel's log rather than any
# fixed value. cloudflared only prints it once at startup and pm2-logrotate
# rotates the log daily, so rotated files are searched too and the result is
# cached in deploy/.<name>.url for when the log ages out entirely.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
logs="$here/logs"

latest_url() {
  local name="$1" cache="$here/.$1.url" url=''
  # Newest log last, so the final match is the most recent URL.
  local files=()
  while IFS= read -r f; do files+=("$f"); done < <(ls -1tr "$logs/$name"*.log 2>/dev/null || true)
  if [ ${#files[@]} -gt 0 ]; then
    url="$(grep -ho 'https://[a-z0-9-]*\.trycloudflare\.com' "${files[@]}" 2>/dev/null | tail -1 || true)"
  fi
  if [ -n "$url" ]; then
    printf '%s' "$url" > "$cache"
  elif [ -f "$cache" ]; then
    url="$(cat "$cache")"          # log rotated away; fall back to the cache
  fi
  printf '%s' "$url"
}

api="$(latest_url tunnel-api)"
adm="$(latest_url tunnel-admin)"

printf '%-14s %s\n' "API (:5000)"   "${api:-<not found — check: pm2 logs scgs-tunnel-api>}"
printf '%-14s %s\n' "Admin (:3000)" "${adm:-<not found — check: pm2 logs scgs-tunnel-admin>}"
