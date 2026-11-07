#!/bin/sh
# Daily logical backup of the SmartGym database. Keeps 14 days.
# Run as root from the systemd timer in deploy/systemd/. Restore steps: docs/DEPLOYMENT.md.
set -eu
DIR=${BACKUP_DIR:-/var/backups/smartgym}
COMPOSE="docker compose -f /opt/smartgym/docker/compose.prod.yml --env-file /etc/smartgym/smartgym.env"
mkdir -p "$DIR"
chmod 700 "$DIR"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
$COMPOSE exec -T postgres pg_dump -U smartgym_owner -d smartgym --format=custom > "$DIR/smartgym-$STAMP.dump.partial"
mv "$DIR/smartgym-$STAMP.dump.partial" "$DIR/smartgym-$STAMP.dump"
find "$DIR" -name 'smartgym-*.dump' -mtime +14 -delete
echo "backup ok: $DIR/smartgym-$STAMP.dump"
