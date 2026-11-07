# SmartGym 2.0: deploying on an AlmaLinux VPS

This sets up one server with Docker, Postgres, the web app, the worker, Nginx with HTTPS and daily backups.
Everything below runs as root (or with `sudo`). Replace `app.example.ir` with your domain.

## 0. Before you start

- A domain (or subdomain) whose DNS A record points to the server's public IP.
- Ports 80 and 443 open. Postgres is never exposed.
- Melipayamak: API key, approved OTP template id, optional expiry reminder template id.
- Saman: terminal number (entered per gym in the app, under Settings), and the server's **public IP registered with Saman** for the IPG. The callback URL is `https://app.example.ir/api/v1/payments/saman/callback`.

## 1. Install Docker, Nginx, certbot

```bash
dnf -y install dnf-plugins-core
dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
dnf -y install docker-ce docker-ce-cli containerd.io docker-compose-plugin git nginx
dnf -y install epel-release && dnf -y install certbot python3-certbot-nginx
systemctl enable --now docker nginx
firewall-cmd --permanent --add-service=http --add-service=https && firewall-cmd --reload
setsebool -P httpd_can_network_connect 1   # SELinux: let Nginx proxy to 127.0.0.1:3000
```

## 2. Get the code and the secrets

```bash
git clone https://github.com/theywsin/smartgym.git /opt/smartgym
mkdir -p /etc/smartgym && install -m 600 /opt/smartgym/deploy/smartgym.env.example /etc/smartgym/smartgym.env
for k in OWNER_DB_PASSWORD APP_DB_PASSWORD OTP_PEPPER JWT_SECRET; do
  sed -i "s|^$k=.*|$k=$(openssl rand -hex 32)|" /etc/smartgym/smartgym.env
done
vi /etc/smartgym/smartgym.env   # APP_URL, Melipayamak key and template ids
```

The env file is the only place secrets live. Do not commit it or paste it anywhere.

## 3. Start the stack

```bash
cd /opt/smartgym
docker compose -f docker/compose.prod.yml --env-file /etc/smartgym/smartgym.env up -d --build
docker compose -f docker/compose.prod.yml --env-file /etc/smartgym/smartgym.env ps
curl -fsS http://127.0.0.1:3000/api/health/ready
```

`migrate` runs once per `up`: it applies pending migrations as the owner role and syncs permissions, roles and plans. It never resets or drops data. `web` and `worker` start only after it succeeds. The app connects as `smartgym_app`, which does not own the tables, so row-level security applies.

## 4. Nginx and HTTPS

```bash
mkdir -p /var/www/letsencrypt
cp deploy/nginx/smartgym.conf /etc/nginx/conf.d/smartgym.conf
sed -i 's/app.example.ir/YOUR.DOMAIN/g' /etc/nginx/conf.d/smartgym.conf
# First certificate: temporarily comment out the 443 server block, then
certbot certonly --webroot -w /var/www/letsencrypt -d YOUR.DOMAIN
# restore the 443 block
nginx -t && systemctl reload nginx
systemctl enable --now certbot-renew.timer
```

Check: `curl -I https://YOUR.DOMAIN/login` returns 200 with `strict-transport-security`.

## 5. Backups

```bash
cp deploy/systemd/smartgym-backup.* /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now smartgym-backup.timer
systemctl start smartgym-backup.service && ls -l /var/backups/smartgym
```

Copy `/var/backups/smartgym` off the server regularly (another server or object storage). A backup that only lives on the same disk is not a backup.

Restore (into an empty database, after stopping web and worker):

```bash
C="docker compose -f docker/compose.prod.yml --env-file /etc/smartgym/smartgym.env"
$C stop web worker
$C exec -T postgres pg_restore -U smartgym_owner -d smartgym --clean --if-exists < /var/backups/smartgym/smartgym-XXXX.dump
$C start web worker
```

## 6. Updating

```bash
cd /opt/smartgym && git pull
systemctl start smartgym-backup.service          # backup first
docker compose -f docker/compose.prod.yml --env-file /etc/smartgym/smartgym.env up -d --build
```

## 7. First owner account

Open `https://YOUR.DOMAIN/login`, sign in with your mobile number (the OTP comes by SMS), then create the gym. Do not set `SEED_DEV` on the server: it creates demo gyms.

## Podman instead of Docker

`podman compose` reads the same file. Use `podman` everywhere `docker` appears, and run `loginctl enable-linger` plus `podman generate systemd` (or Quadlet) so containers start on boot.
