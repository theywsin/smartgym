#!/bin/sh
# Creates the runtime role on first start of an empty data directory.
# It does not own the tables, so row-level security applies to everything the app does.
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v app_pw="$APP_DB_PASSWORD" <<'SQL'
CREATE ROLE smartgym_app LOGIN PASSWORD :'app_pw';
SQL
