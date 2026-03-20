# Production Deploy

## Stack

- `Next.js` app runs on `127.0.0.1:3020`
- `nginx` terminates SSL and proxies requests
- `systemd` keeps the app running
- current database is `SQLite` via `prisma/dev.db`

## 1. Prepare Server

Install base packages:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx git curl build-essential
```

Install Node.js 20+:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 2. Create App User

```bash
sudo useradd --system --create-home --shell /bin/bash ramzident
sudo mkdir -p /var/www
sudo chown -R ramzident:ramzident /var/www
```

## 3. Clone Project

```bash
cd /var/www
sudo -u ramzident git clone <YOUR_GITHUB_REPO_URL> ramzident
cd /var/www/ramzident
sudo chown -R ramzident:ramzident /var/www/ramzident
sudo install -d -o ramzident -g ramzident /var/www/ramzident/prisma
sudo touch /var/www/ramzident/prisma/dev.db
sudo chown ramzident:ramzident /var/www/ramzident/prisma/dev.db
sudo install -d -o ramzident -g ramzident /var/www/ramzident/public/uploads
sudo install -d -o ramzident -g ramzident /var/www/ramzident/public/og
```

This is required for two things:

- SQLite must be writable in `prisma/dev.db`
- media uploads must be writable in `public/uploads`
- generated OG files must be writable in `public/og`

If your real path is nested, for example `/var/www/product/ramzident`, make sure
the service unit allows writes there too. The included deploy script handles this
automatically.

## 4. Configure Environment

Create production `.env`:

```bash
sudo -u ramzident cp .env.example .env
sudo -u ramzident nano .env
```

Minimum required values:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="https://example.com"
SITE_URL="https://example.com"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
SETTINGS_ENCRYPTION_KEY="replace-with-a-long-random-secret"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="replace-with-a-strong-password"
```

Notes:

- most site settings are managed from `/admin/settings`
- `DATABASE_URL="file:./dev.db"` stores SQLite inside `prisma/dev.db`
- `SITE_URL` must match the public HTTPS domain exactly, otherwise OG/canonical URLs may point to the wrong host
- if you use SQLite in production, make sure the app user can write to `prisma/`

## 5. Install Dependencies

```bash
sudo -u ramzident npm install
```

## 6. Generate Prisma Client and Seed

```bash
sudo -u ramzident npx prisma generate
sudo -u ramzident npm run db:seed
```

If you later add Prisma migrations:

```bash
sudo -u ramzident npx prisma migrate deploy
```

## 7. Build Application

```bash
sudo -u ramzident npm run build
```

## 8. Install systemd Unit

Copy the example unit:

```bash
sudo cp ramzident-nextjs.service.example /etc/systemd/system/ramzident.service
```

Edit it if needed:

```bash
sudo nano /etc/systemd/system/ramzident.service
```

Then enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ramzident
sudo systemctl start ramzident
sudo systemctl status ramzident
```

Useful commands:

```bash
sudo systemctl restart ramzident
sudo systemctl stop ramzident
sudo journalctl -u ramzident -f
```

## 9. Install nginx Config

Copy example config:

```bash
sudo cp nginx.example.conf /etc/nginx/sites-available/ramzident.conf
sudo nano /etc/nginx/sites-available/ramzident.conf
```

Replace:

- `example.com`
- `www.example.com`
- SSL certificate paths if needed
- keep `client_max_body_size 50m;` for admin media uploads and file replacement
- set correct absolute `root` path for static runtime media:
  - `location /uploads/ { root <APP_DIR>/public; try_files $uri =404; }`
  - `location /og/ { root <APP_DIR>/public; try_files $uri =404; }`
  Example for nested deploy path: `/var/www/product/ramzident/public/uploads/`

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/ramzident.conf /etc/nginx/sites-enabled/ramzident.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 10. Issue SSL Certificate

If domain already points to server:

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

Then reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 11. Update Deployment

For the next release:

```bash
cd /var/www/ramzident
sudo -u ramzident git pull
sudo chown -R ramzident:ramzident /var/www/ramzident
sudo install -d -o ramzident -g ramzident /var/www/ramzident/prisma
sudo touch /var/www/ramzident/prisma/dev.db
sudo chown ramzident:ramzident /var/www/ramzident/prisma/dev.db
sudo install -d -o ramzident -g ramzident /var/www/ramzident/public/uploads
sudo install -d -o ramzident -g ramzident /var/www/ramzident/public/og
sudo -u ramzident npm install
sudo -u ramzident npx prisma generate
sudo -u ramzident npx prisma migrate deploy
sudo -u ramzident npm run build
sudo -u ramzident npm run og:generate
sudo systemctl restart ramzident
```

If no migrations were added, `prisma migrate deploy` can be skipped.

Or use the deploy script from the repo root:

```bash
sudo APP_USER=ramzident SERVICE_NAME=ramzident ./scripts/deploy-production.sh
```

For a nested path such as `/var/www/product/ramzident`, run it from that repo
directory or pass the path explicitly:

```bash
cd /var/www/product/ramzident
sudo APP_USER=ramzident SERVICE_NAME=ramzident ./scripts/deploy-production.sh
```

The script will:

- fix ownership of the repo
- recreate writable `prisma/`, `public/uploads/` and `public/og/`
- recreate writable `prisma/dev.db`
- patch `ReadWritePaths` in the systemd unit when `ProtectSystem=full` blocks writes
- run `git pull`, `npm install`, `prisma generate`, `prisma migrate deploy`, `npm run build`, `npm run og:generate`
- restart the service

## 12. File Permissions

Make sure app files belong to the app user:

```bash
sudo chown -R ramzident:ramzident /var/www/ramzident
```

For SQLite and uploads:

```bash
sudo chown -R ramzident:ramzident /var/www/ramzident/prisma
sudo mkdir -p /var/www/ramzident/public/uploads
sudo chown -R ramzident:ramzident /var/www/ramzident/public/uploads
sudo mkdir -p /var/www/ramzident/public/og
sudo chown -R ramzident:ramzident /var/www/ramzident/public/og
```

## 13. Post-Deploy Checklist

- open `https://example.com`
- verify `/admin/login`
- verify media uploads work
- verify a newly uploaded `/uploads/...` URL opens immediately without app restart
- if upload returns `413`, verify nginx has `client_max_body_size 50m;` and app is deployed with `experimental.proxyClientMaxBodySize` in `next.config.ts`
- verify `https://example.com/og/site.jpg` returns `200` and `content-type: image/jpeg`
- verify `https://example.com/opengraph-image` returns `200` and `content-type: image/png`
- verify `/documents` and service pages open
- verify `/robots.txt` and `/sitemap.xml`
- verify `sudo systemctl status ramzident`
- verify `sudo nginx -t`

## Notes

- current setup uses `SQLite`; for heavier production workloads, `PostgreSQL` is safer
- if you change the internal app port, update both:
  - `ramzident-nextjs.service`
  - `nginx.example.conf`
