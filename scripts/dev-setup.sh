#!/usr/bin/env bash
# One-command local setup for SmartGym 2.0 (macOS / Linux).
#   ./scripts/dev-setup.sh          set up (safe to re-run) and start the web app on http://localhost:3001
#   ./scripts/dev-setup.sh --reset  also wipe the local dev database first
# Needs: Node 22, Docker. Uses Postgres on port 5433 so it never clashes with another local Postgres.
set -euo pipefail
cd "$(dirname "$0")/.."

# Reuse the port saved by a previous run, otherwise pick the first free port from 5433.
SAVED_PORT=$(grep -s '^SMARTGYM_DB_PORT=' .dev-db-port | cut -d= -f2 || true)
free_port() { node -e "
const net=require('net');(async()=>{for(let p=5433;p<5500;p++){const ok=await new Promise(r=>{const s=net.createServer().once('error',()=>r(false)).once('listening',()=>s.close(()=>r(true))).listen(p,'0.0.0.0')});if(ok){console.log(p);return}}process.exit(1)})()"; }
ENV_FILE=apps/web/.env.local
say() { printf '\n\033[1;32m▶ %s\033[0m\n' "$1"; }

command -v node >/dev/null || { echo "Node.js 22 is not installed: https://nodejs.org"; exit 1; }

if [ "${SKIP_DOCKER:-}" != "1" ]; then
  command -v docker >/dev/null || { echo "Docker Desktop is not installed or not running."; exit 1; }
  if [ "${1:-}" = "--reset" ]; then say "Removing the old dev database"; docker compose -f docker/compose.dev.yml down -v; SAVED_PORT=""; fi
  # If our container is already running keep its port; otherwise choose a free one.
  RUNNING_PORT=$(docker compose -f docker/compose.dev.yml port postgres 5432 2>/dev/null | sed 's/.*://' || true)
  PORT_DB=${PORT_DB:-${RUNNING_PORT:-${SAVED_PORT:-}}}
  if [ -z "$PORT_DB" ] || { [ -z "$RUNNING_PORT" ] && ! node -e "require('net').createServer().once('error',()=>process.exit(1)).listen($PORT_DB,'0.0.0.0',function(){this.close()})"; }; then PORT_DB=$(free_port); fi
  echo "SMARTGYM_DB_PORT=$PORT_DB" > .dev-db-port
  export SMARTGYM_DB_PORT=$PORT_DB
  say "Starting Postgres (port ${SMARTGYM_DB_PORT})"
  docker compose -f docker/compose.dev.yml up -d postgres
  printf "Waiting for Postgres"
  for i in $(seq 1 60); do
    if docker compose -f docker/compose.dev.yml exec -T postgres pg_isready -U smartgym_owner -d smartgym >/dev/null 2>&1; then break; fi
    printf "."; sleep 1
    [ "$i" = 60 ] && { echo; echo "Postgres did not start. Run: docker compose -f docker/compose.dev.yml logs postgres"; exit 1; }
  done
  # The init script that creates the app role only runs on a fresh volume; make sure it exists.
  docker compose -f docker/compose.dev.yml exec -T postgres psql -q -U smartgym_owner -d smartgym -c \
    "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='smartgym_app') THEN CREATE ROLE smartgym_app LOGIN PASSWORD 'app'; END IF; END \$\$; ALTER ROLE smartgym_app PASSWORD 'app'; ALTER ROLE smartgym_owner PASSWORD 'owner';" >/dev/null
  echo " ready"
fi

PORT_DB=${PORT_DB:-5433}
APP_URL_DB="postgresql://smartgym_app:app@localhost:${PORT_DB}/smartgym"
OWNER_URL_DB="postgresql://smartgym_owner:owner@localhost:${PORT_DB}/smartgym"

say "Writing ${ENV_FILE}"
[ -f "$ENV_FILE" ] || cp apps/web/.env.example "$ENV_FILE"
secret() { node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"; }
node - "$ENV_FILE" "$APP_URL_DB" "$OWNER_URL_DB" "$(secret)" "$(secret)" <<'JS'
const fs = require("fs");
const [file, appUrl, ownerUrl, pepper, jwt] = process.argv.slice(2);
let s = fs.readFileSync(file, "utf8");
const set = (k, v, keep) => {
  const re = new RegExp(`^${k}=.*$`, "m");
  const cur = s.match(re)?.[0].split("=").slice(1).join("=").replace(/^"|"$/g, "");
  if (keep && cur && cur.length >= 32) return;
  s = re.test(s) ? s.replace(re, `${k}="${v}"`) : `${s.trimEnd()}\n${k}="${v}"\n`;
};
set("DATABASE_URL", appUrl); set("MIGRATION_DATABASE_URL", ownerUrl);
set("OTP_PEPPER", pepper, true); set("JWT_SECRET", jwt, true);
set("SMS_PROVIDER", "console"); set("APP_URL", "http://localhost:3001"); set("PAYMENT_GATEWAY", "sandbox");
fs.writeFileSync(file, s);
JS

say "Installing packages"
npm install --no-audit --no-fund

say "Creating tables"
MIGRATION_DATABASE_URL="$OWNER_URL_DB" DATABASE_URL="$OWNER_URL_DB" npm run -s migrate:deploy -w @smartgym/db

say "Adding base data and two demo gyms"
DATABASE_URL="$OWNER_URL_DB" npm run -s seed -w @smartgym/db
DATABASE_URL="$OWNER_URL_DB" SEED_DEV=true npm run -s seed -w @smartgym/db

say "Done. Open http://localhost:3001 and sign in with 09120000001 (the SMS code is printed below)."
[ "${NO_START:-}" = "1" ] && exit 0
exec npm run dev -w @smartgym/web -- -p 3001
