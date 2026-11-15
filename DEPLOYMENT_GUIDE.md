# Deploying Lmsify: Docker → Oracle Cloud → CI/CD

A learn-by-doing guide. Each phase has:

- 🎯 **Goal**: what you'll have at the end
- 📚 **Concepts**: the minimum theory you need
- 🛠 **Your task**: you write or run this yourself
- ✅ **Checkpoint**: how you know it worked
- 🔒 **Reference solution**: collapsed. Try first, peek only when stuck.

When you get stuck, paste the error or your file into chat and ask me to review it. Fighting with errors is where most of the learning happens.

---

## The big picture

```
                 Internet
                    │  :80 / :443
        ┌───────────▼──────────────────── Oracle VM (Ubuntu) ──┐
        │   ┌─────────────┐                                    │
        │   │  web (Caddy)│  serves client/dist (React build)  │
        │   │  auto-HTTPS │  /api/*  ──►  api:4000             │
        │   └──────┬──────┘                                    │
        │          ▼                                           │
        │   ┌─────────────┐     ┌─────────┐   ┌─────────┐      │
        │   │ api (Node)  │────►│  mongo  │   │  redis  │      │
        │   └─────────────┘     └─────────┘   └─────────┘      │
        │        (all 4 run as containers via docker compose)  │
        └──────────────────────────────────────────────────────┘
   R2 (media) and Razorpay stay external, same as today.
```

**Key decision:** the frontend and the API share **one domain**. Caddy serves the React files and forwards `/api/*` to the Node container. That means:

- `VITE_API_URL=/api/v1` (a relative URL, so no hard-coded host)
- no cross-origin cookie trouble for the refresh token
- one HTTPS certificate, which Caddy gets and renews for you automatically

---

## Phase 1: Run everything in Docker on your laptop

🎯 **Goal:** `docker compose up --build` starts the whole app at http://localhost.

📚 **Concepts**

| Term | One-line meaning |
|---|---|
| **Image** | A frozen snapshot of an app plus its OS libraries. Built from a `Dockerfile`. |
| **Container** | A running instance of an image. |
| **Multi-stage build** | Stage 1 has the build tools and compiles the code. Stage 2 copies only the output, so the final image is small. |
| **docker compose** | A YAML file that describes several containers, their network and their volumes. |
| **Volume** | Storage that survives container restarts. Mongo data lives here. |
| **Service name = hostname** | Inside compose, the `api` container reaches Mongo at `mongo:27017`, not `localhost`. |

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) first.

🛠 **Your task**: create these 6 files:

1. `server/Dockerfile`: multi-stage.
   - Stage 1 (`node:22-slim`): `npm ci`, copy the source, `npm run build`, which produces `dist/`.
   - Stage 2 (`node:22-slim`): `npm ci --omit=dev`, copy `dist/` from stage 1, run `node dist/index.js` as the non-root `node` user.
   - 💡 Copy `package*.json` and run `npm ci` **before** copying the source. Docker caches each layer, so dependencies only reinstall when `package.json` changes.
   - 💡 Use `-slim` (Debian), not `-alpine`. `bcrypt` is a native module and is happier on glibc.
2. `server/.dockerignore`: keep `node_modules`, `dist` and `.env` out of the image. **Never bake secrets into an image.**
3. `client/Caddyfile`: listen on `{$SITE_ADDRESS::80}`. Send `/api/*` to `api:4000`. Serve everything else from `/srv`, falling back to `/index.html`, because React Router handles the routes.
4. `client/Dockerfile`: multi-stage.
   - Stage 1 (`node:22-slim`): build with `VITE_API_URL=/api/v1`.
   - Stage 2 (`caddy:2-alpine`): copy `dist` to `/srv` and the Caddyfile to `/etc/caddy/Caddyfile`.
   - 💡 `VITE_*` variables are baked in **at build time**, not at runtime. Pass them with `ARG` and `ENV` in the build stage.
5. `client/.dockerignore`: `node_modules`, `dist`, `.env*`.
6. `docker-compose.yml` at the repo root, with 4 services (`web`, `api`, `mongo:7`, `redis:7-alpine`).
   - Only `web` publishes ports (80 and 443). **Mongo and Redis must not be exposed** to the internet.
   - `api` reads `env_file: ./server/.env`, then overrides `MONGO_URI`, `REDIS_URL` and `NODE_ENV=production`.
   - Add a named volume for Mongo data and one for Caddy's `/data`, where its certificates are kept.
   - Add `restart: unless-stopped` everywhere, so containers come back after a crash or a reboot.

Then set `FRONTEND_URL=http://localhost` in `server/.env` and run:

```bash
docker compose up --build
```

✅ **Checkpoint**

- http://localhost loads the app.
- http://localhost/api/v1/courses returns JSON (or whatever your courses route responds with).
- You can register, log in and refresh the page while staying logged in. That last one proves the refresh cookie works.
- `docker compose down` then `docker compose up` brings the app back and your user still exists, which proves the volume works.

Useful commands: `docker compose ps`, `docker compose logs -f api`, `docker compose exec mongo mongosh`.

<details>
<summary>🔒 Reference: server/Dockerfile + .dockerignore</summary>

```dockerfile
# ---- build stage ----
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

```
node_modules
dist
.env
```
</details>

<details>
<summary>🔒 Reference: client/Caddyfile + Dockerfile + .dockerignore</summary>

```caddyfile
{$SITE_ADDRESS::80} {
	encode gzip
	handle /api/* {
		reverse_proxy api:4000
	}
	handle {
		root * /srv
		try_files {path} /index.html
		file_server
	}
}
```

```dockerfile
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
```

```
node_modules
dist
.env*
```
</details>

<details>
<summary>🔒 Reference: docker-compose.yml</summary>

```yaml
services:
  web:
    build: ./client
    ports:
      - "80:80"
      - "443:443"
    environment:
      SITE_ADDRESS: ${SITE_ADDRESS:-:80}
    volumes:
      - caddy_data:/data
    depends_on: [api]
    restart: unless-stopped

  api:
    build: ./server
    env_file: ./server/.env
    environment:
      NODE_ENV: production
      MONGO_URI: mongodb://mongo:27017/lmsify
      REDIS_URL: redis://redis:6379
    depends_on: [mongo, redis]
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  mongo_data:
  caddy_data:
```

`${SITE_ADDRESS:-:80}` reads `SITE_ADDRESS` from a root `.env` file or your shell, and defaults to `:80`.
</details>

**Commit these files** once the checkpoint passes. Phase 3 pulls them from GitHub.

---

## Phase 2: Create the Oracle Cloud server

🎯 **Goal:** a free Ubuntu VM with Docker that you can SSH into, with ports 80 and 443 open.

📚 **Concepts**: a **VM** is a rented computer. **SSH** logs you into it with a key pair: the private key stays on your laptop, the public key goes on the server. A **firewall** decides which ports the internet can reach.

🛠 **Your task**

1. Sign up at cloud.oracle.com. The Always Free tier needs a card for verification, but it doesn't charge for free-tier resources.
2. **Compute → Instances → Create instance**
   - Image: **Ubuntu 24.04**
   - Shape: **Ampere A1 (VM.Standard.A1.Flex)**, 2 OCPU and 12 GB RAM, which is free.
     - ⚠️ If you get "Out of capacity", try another Availability Domain or retry later. That's common.
     - ⚠️ This is an **ARM** CPU. That's fine here because we build images on the server itself.
   - SSH keys: choose "Generate a key pair" and **download the private key**, or paste your own `~/.ssh/id_ed25519.pub`.
3. Note the instance's **Public IP**, then connect:
   ```bash
   chmod 600 ~/Downloads/ssh-key-*.key
   ```
   ```bash
   ssh -i ~/Downloads/ssh-key-*.key ubuntu@<PUBLIC_IP>
   ```
4. **Open ports 80 and 443.** Oracle has **two** firewalls, and this trips up almost everyone:
   - **Cloud firewall:** Networking → Virtual Cloud Networks → your VCN → Subnet → Security List → *Add Ingress Rules*. Source `0.0.0.0/0`, TCP, destination ports `80,443`.
   - **The VM's own iptables.** On the server, run:
     ```bash
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
     sudo netfilter-persistent save
     ```
5. Install Docker on the server:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker ubuntu
   exit   # log back in so the group change applies
   ```

✅ **Checkpoint:** after logging back in, `docker run --rm hello-world` prints "Hello from Docker!".

💡 Add a shortcut to `~/.ssh/config` on your laptop so you can just type `ssh lmsify`:
```
Host lmsify
  HostName <PUBLIC_IP>
  User ubuntu
  IdentityFile ~/.ssh/oracle_lmsify.key
```

---

## Phase 3: Deploy by hand (do this before automating)

🎯 **Goal:** the app is live on `https://<something>` with a real certificate.

📚 **Concepts**

- **Domain:** HTTPS certificates are issued for domain names, not bare IPs. No domain yet? Use **sslip.io**: `140-238-1-2.sslip.io` resolves to `140.238.1.2` (dashes, not dots). It's free and works with Let's Encrypt.
- **Caddy auto-HTTPS:** give Caddy a domain name instead of `:80` and it fetches a Let's Encrypt certificate and redirects HTTP to HTTPS on its own.

🛠 **Your task**

1. **Get the code onto the server.** If the repo is private, the server needs read access:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
   cat ~/.ssh/github_deploy.pub
   ```
   Add that public key in GitHub under repo → Settings → Deploy keys (read-only). Then:
   ```bash
   printf 'Host github.com\n  IdentityFile ~/.ssh/github_deploy\n' >> ~/.ssh/config
   ```
   ```bash
   git clone git@github.com:jai-touchkin/lmsify.git ~/lmsify
   ```
2. **Create the secrets on the server only.** Never commit them.
   ```bash
   cd ~/lmsify
   nano server/.env
   ```
   Start from `server/.env.example`. Set `FRONTEND_URL=https://<your-domain>`. Generate new JWT secrets with `openssl rand -hex 32`, and don't reuse your dev ones. `MONGO_URI` and `REDIS_URL` are overridden by compose, but the env validation still needs them present, so leave any value.
3. **Tell Caddy the domain** in a root `.env`, which docker compose reads automatically:
   ```bash
   echo "SITE_ADDRESS=<your-domain>" > .env
   ```
4. **Start it:**
   ```bash
   docker compose up -d --build
   ```
5. **Update the external services** to know about the new URL:
   - **Cloudflare R2 → bucket → CORS:** add `https://<your-domain>` to the allowed origins, or browser uploads will fail.
   - **Razorpay → Webhooks:** point the webhook to `https://<your-domain>/api/v1/payment/webhook`.

✅ **Checkpoint**

- `https://<your-domain>` shows a padlock 🔒.
- Register, log in, refresh, open a course and play a lecture.
- `docker compose logs api` shows `MongoDB connected` and `Redis connected`.
- `sudo reboot`, wait a minute, and the site comes back by itself, thanks to `restart: unless-stopped`.

🐛 **Common problems**

| Symptom | Likely cause |
|---|---|
| Browser times out | One of the two firewalls from Phase 2, step 4 |
| Caddy logs show an ACME or certificate error | Port 80 is blocked (Let's Encrypt needs it), or the domain doesn't point at this IP |
| `api` keeps restarting | `docker compose logs api` will show a `❌ Invalid environment variables` list |
| Logged out after refresh | `FRONTEND_URL` doesn't match, or you're on `http://` (the cookie is `Secure`) |
| Build gets killed | Out of memory. Add swap: `sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |

The **manual deploy loop** is: `git pull` → `docker compose up -d --build`. Phase 4 automates exactly those two commands.

---

## Phase 4: CI/CD with GitHub Actions

🎯 **Goal:** every push to `main` is checked, and if the checks pass, it's deployed automatically. Pull requests get checked but not deployed.

📚 **Concepts**

- **CI (Continuous Integration):** on every push, a clean machine installs and builds your code, which catches "works on my machine" breakage.
- **CD (Continuous Deployment):** if CI passes, ship it.
- **GitHub Actions:** YAML files in `.github/workflows/`. GitHub runs them on its own machines (runners).
- **Secrets:** values like your SSH key are stored encrypted in repo → Settings → Secrets and variables → Actions, and read with `${{ secrets.NAME }}`. They never appear in logs.
- `needs:` makes one job wait for another, so a failing build never deploys.

🛠 **Your task**

1. **Make a dedicated SSH key for GitHub to log into your server.** Don't reuse your personal key. On your laptop:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/gh_actions_lmsify -N ""
   ssh lmsify "cat >> ~/.ssh/authorized_keys" < ~/.ssh/gh_actions_lmsify.pub
   ```
2. **Add 3 repo secrets:**
   - `SSH_HOST` is the server IP.
   - `SSH_USER` is `ubuntu`.
   - `SSH_KEY` is the full contents of `~/.ssh/gh_actions_lmsify`, the **private** key.
3. **Write `.github/workflows/deploy.yml`** with two jobs:
   - `check`: runs on `push` to main **and** on `pull_request`. Use a matrix over `[client, server]`. In each, run checkout → setup-node 22 → `npm ci` → `npm run build`.
   - `deploy`: `needs: check`, and only runs on a push to main. It SSHes in using [`appleboy/ssh-action`](https://github.com/appleboy/ssh-action) and runs the manual deploy loop from Phase 3.
   - 💡 Add `concurrency: deploy` so two quick pushes don't deploy on top of each other.

✅ **Checkpoint**

- Change some visible text, then push to main.
- Watch the repo's **Actions** tab: `check` passes, then `deploy` runs.
- Refresh your site and the change is live.
- Open a PR with a deliberate TypeScript error. `check` fails and nothing deploys. Then close the PR.

<details>
<summary>🔒 Reference: .github/workflows/deploy.yml</summary>

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [client, server]
    defaults:
      run:
        working-directory: ${{ matrix.app }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: ${{ matrix.app }}/package-lock.json
      - run: npm ci
      - run: npm run build

  deploy:
    needs: check
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    concurrency: deploy
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            set -e
            cd ~/lmsify
            git pull --ff-only
            docker compose up -d --build
            docker image prune -f
```
</details>

---

## Phase 5: Running it day to day

🛠 **Learn these by actually running them on the server:**

```bash
docker compose ps
```
```bash
docker compose logs -f --tail=100 api
```
```bash
docker compose restart api
```
```bash
docker compose exec mongo mongosh lmsify
```
```bash
docker system df
```

The first shows what's running and its health. The second follows the live API logs. The third restarts one service. The fourth opens a database shell. The fifth shows how much disk Docker uses.

**Back up the database.** Your data lives on one disk, so if the VM dies, the data goes with it. Add a nightly backup with `crontab -e`:

```
0 3 * * * cd ~/lmsify && mkdir -p ~/backups && docker compose exec -T mongo mongodump --archive --gzip > ~/backups/lmsify-$(date +\%F).gz && find ~/backups -mtime +7 -delete
```

Test a restore at least once. A backup you've never restored isn't really a backup:
```bash
docker compose exec -T mongo mongorestore --archive --gzip --drop < ~/backups/lmsify-YYYY-MM-DD.gz
```

Then copy backups **off** the VM, for example by uploading them to your R2 bucket.

---

## Level-ups (once everything above is boring)

1. **Build images in CI, not on the server.** Push them to GitHub Container Registry (ghcr.io) and have the server only run `docker compose pull && up -d`. That gives faster deploys and easy rollback to an old image tag. Note: you'll need `docker buildx` with `--platform linux/arm64` because the VM is ARM.
2. **Healthchecks:** add a `healthcheck:` that calls `/health` in compose, so you can see when the API is actually ready.
3. **Real domain:** buy one, add an `A` record pointing to the VM IP, and change `SITE_ADDRESS`.
4. **Uptime alerts:** a free monitor (UptimeRobot, Better Stack) that pings `/health` and emails you when it's down.
5. **Managed Mongo:** MongoDB Atlas free tier instead of the container, which gives you backups for free. Change `MONGO_URI` and remove the `mongo` service.
6. **Security hardening:** turn off SSH password login and set up `unattended-upgrades` for automatic OS security patches.
