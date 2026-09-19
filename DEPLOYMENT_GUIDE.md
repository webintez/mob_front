# GitHub Actions Auto-Deployment Setup Guide

This project includes a fully automated continuous deployment (CD) pipeline via GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

Whenever you push to the `main` or `master` branch, GitHub Actions will automatically connect to your VPS via SSH, pull the latest changes, build the Docker container, and deploy with zero downtime.

---

## Required GitHub Repository Secrets

To activate auto-deployment, go to your GitHub repository:
👉 **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions** $\rightarrow$ Click **New repository secret**

Add the following secrets:

| Secret Name | Description | Example Value |
| :--- | :--- | :--- |
| **`VPS_HOST`** | Your VPS IP address or hostname | `72.60.217.168` |
| **`VPS_USER`** | SSH user on your VPS | `root` (or `u934861248`) |
| **`VPS_SSH_KEY`** | The private SSH key used to log in | Entire content of `~/.ssh/id_rsa` or `~/.ssh/id_ed25519` (including `-----BEGIN ... KEY-----` and `-----END ... KEY-----`) |
| **`VPS_PORT`** | SSH port on your VPS *(optional, defaults to 22)* | `22` (or `65002` if custom) |
| **`VPS_DEPLOY_PATH`** | Folder path on your VPS *(optional, defaults to `/var/www/mobitez_frontend`)* | `/var/www/mobitez_frontend` |

---

## One-Time VPS Preparation

Before the very first automatic deployment runs:

### 1. Ensure Docker & Git are Available on VPS
SSH into your VPS and verify:
```bash
docker --version
docker compose version
git --version
```

### 2. First-Time Folder & .env Setup
Create the folder and add your `.env` with production keys:
```bash
sudo mkdir -p /var/www/mobitez_frontend
sudo chown -R $USER:$USER /var/www/mobitez_frontend
cd /var/www/mobitez_frontend

# Clone the repository
git clone git@github.com:webintez/mob_front.git .

# Create production .env
cp .env.example .env
nano .env
```
Ensure your `.env` contains:
```env
PORT=3055
NODE_ENV=production
API_BASE_URL=http://mobitez_app/api
API_KEY=mHRT3jvUD7tqSVy+iPIn3DE+wyuJXcBeLaPIjBGVHMo=
```

---

## How It Works

1. **Trigger**: You commit and push code to GitHub:
   ```bash
   git add .
   git commit -m "Update homepage banners"
   git push origin main
   ```
2. **Execute**: GitHub Actions securely connects to your VPS over SSH using `VPS_SSH_KEY`.
3. **Pull**: Runs `git fetch origin` and resets cleanly to the latest commit.
4. **Rebuild**: Runs `docker compose build` and restarts the container gracefully (`docker compose up -d`).
5. **Clean**: Automatically removes obsolete dangling Docker images to keep your VPS disk clean.

You can monitor the live deployment logs directly under the **Actions** tab on GitHub!
