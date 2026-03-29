# Self-Hosting Guide — Finansiel Rådgivning

This guide explains how to run the application on your own server, completely independent of the Manus platform. Once self-hosted, the "Made with Manus" watermark is absent, and you have full control over your data and infrastructure.

---

## What the App Needs

The application has three runtime dependencies:

| Dependency | Purpose | Self-hosted option |
|---|---|---|
| **Node.js 22** | Runs the Express + tRPC server | Pre-installed or via Docker |
| **MySQL 8** | Stores products, returns, and user sessions | Docker (included in `docker-compose.yml`) or any managed MySQL |
| **Disk / S3** | Temporary Excel file uploads | Local disk (default) |

The app does **not** require any Manus-specific services. The Manus OAuth, storage proxy, LLM, and notification APIs are all optional and unused by the application logic — they can be left blank in the environment file.

---

## Option A — Docker Compose (Recommended)

This is the fastest path to a running instance. Docker Compose starts both the application and a MySQL database in isolated containers.

### Prerequisites

- A Linux server (Ubuntu 22.04 recommended) with at least 1 GB RAM
- [Docker Engine](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) installed
- The project source code (clone from GitHub or download as ZIP)

### Step 1 — Get the source code

```bash
git clone https://github.com/MartinViewall/finansiel-raadgivning.git
cd finansiel-raadgivning
```

### Step 2 — Create your environment file

Copy the example file and fill in the three required values:

```bash
cp .env.example .env
```

Open `.env` in a text editor and set:

```
DATABASE_URL=mysql://finansiel:YOUR_DB_PASSWORD@db:3306/finansiel
JWT_SECRET=<output of: openssl rand -hex 32>
APP_PASSWORD=<the password advisors will use to log in>
MYSQL_PASSWORD=YOUR_DB_PASSWORD
MYSQL_ROOT_PASSWORD=YOUR_ROOT_PASSWORD
```

> **Important:** `DATABASE_URL` must use `@db:3306` (not `localhost`) when running inside Docker Compose, because `db` is the internal service name.

### Step 3 — Build and start

```bash
docker compose up -d --build
```

The first build takes 2–4 minutes. Once complete, the app is available at `http://YOUR_SERVER_IP:3000`.

### Step 4 — Run database migrations

On first start, create the database tables:

```bash
docker compose exec app pnpm drizzle-kit migrate
```

### Step 5 — Verify

Open `http://YOUR_SERVER_IP:3000` in a browser. You should see the login screen. Enter the `APP_PASSWORD` you set in `.env`.

---

## Option B — Manual Node.js Deployment

Use this option if you prefer to manage Node.js and MySQL yourself, or if you are deploying to a platform like Railway, Render, or a VPS without Docker.

### Prerequisites

- Node.js 22 and pnpm installed (`npm install -g pnpm`)
- A running MySQL 8 database (local or managed, e.g. PlanetScale, Railway MySQL, DigitalOcean Managed DB)

### Step 1 — Install dependencies

```bash
pnpm install
```

### Step 2 — Set environment variables

Create a `.env` file in the project root (or set the variables in your hosting platform's dashboard):

```
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
JWT_SECRET=<output of: openssl rand -hex 32>
APP_PASSWORD=your-secure-password
NODE_ENV=production
PORT=3000
```

Leave all other variables (VITE_APP_ID, OAUTH_SERVER_URL, etc.) empty or omit them entirely.

### Step 3 — Run database migrations

```bash
pnpm drizzle-kit migrate
```

### Step 4 — Build the application

```bash
pnpm run build
```

This produces a `dist/` folder containing the compiled server and the bundled frontend.

### Step 5 — Start the server

```bash
pnpm start
```

The server starts on the port defined by `PORT` (default: 3000).

---

## Putting the App Behind a Domain (HTTPS)

For production use, place a reverse proxy in front of the Node.js server. [Caddy](https://caddyserver.com/) is the simplest option — it handles HTTPS certificates automatically.

**Example `Caddyfile`:**

```
finansraagivning.yourdomain.dk {
    reverse_proxy localhost:3000
}
```

Start Caddy with `caddy run` and it will obtain a Let's Encrypt certificate automatically. Nginx or Traefik work equally well if you prefer them.

---

## Keeping the App Updated

When a new version is available on GitHub:

```bash
git pull
pnpm install
pnpm run build
pnpm drizzle-kit migrate   # only if schema changed
pnpm start
```

With Docker Compose:

```bash
git pull
docker compose up -d --build
docker compose exec app pnpm drizzle-kit migrate
```

---

## Environment Variable Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | Random secret for signing session cookies |
| `APP_PASSWORD` | Yes | Password for the advisor login screen |
| `PORT` | No | HTTP port (default: 3000) |
| `NODE_ENV` | No | Set to `production` for the built app |
| `MYSQL_PASSWORD` | Docker only | MySQL user password (used by docker-compose.yml) |
| `MYSQL_ROOT_PASSWORD` | Docker only | MySQL root password (used by docker-compose.yml) |

All other variables (`VITE_APP_ID`, `OAUTH_SERVER_URL`, `BUILT_IN_FORGE_API_*`, etc.) are Manus platform variables and should be left blank or omitted when self-hosting.

---

## Backing Up Your Data

All application data lives in the MySQL database. Back it up with:

```bash
# Docker Compose
docker compose exec db mysqldump -u finansiel -p finansiel > backup.sql

# Manual / managed DB
mysqldump -h HOST -u USER -p DATABASE > backup.sql
```

Restore with:

```bash
mysql -h HOST -u USER -p DATABASE < backup.sql
```

---

## Troubleshooting

**The app starts but shows a database error.**
Verify that `DATABASE_URL` is correct and that the MySQL server is reachable. Run `pnpm drizzle-kit migrate` to ensure all tables exist.

**Login fails with "Forkert adgangskode".**
Check that `APP_PASSWORD` in your `.env` matches what you are typing on the login screen.

**Port 3000 is already in use.**
Set `PORT=8080` (or any free port) in your `.env` file.

**Excel upload fails.**
The upload endpoint stores files in memory during processing — no persistent storage is required. If uploads fail, check that the server has at least 256 MB of free memory.
