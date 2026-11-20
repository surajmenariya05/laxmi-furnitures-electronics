# 🚀 Monorepo Architecture & Deployment Best Practices
## (Vercel, Northflank, Neon, & Supabase)

This document explains the production deployment architecture, separation of concerns, and selective deployment rules configured across this repository to prevent accidental builds, save build quota, and ensure high availability.

---

## 🏗️ 1. Architecture Overview

This repository operates as a **Monorepo** containing two distinct services and auxiliary automation:

| Component | Directory | Platform | Purpose |
| :--- | :--- | :--- | :--- |
| **Store Web Application** | `Furniture-and-Electronics/` | **Vercel** | Next.js 16 (React 19) App Router frontend and REST APIs |
| **WhatsApp Daemon** | `whatsapp-bot/` | **Northflank** | Standalone Baileys microservice for real-time WhatsApp invoice delivery |
| **Primary Database** | N/A | **Neon PostgreSQL** | Serverless PostgreSQL 18 with connection pooling |
| **Media / Design Storage** | N/A | **Supabase Storage** | Public image bucket (`laxmi-designs`) for custom booking designs |
| **Disaster Recovery Scripts** | `scripts/` | Local / GitHub | Automated backup and restore utilities |
| **Scheduled Tasks** | `.github/workflows/` | GitHub Actions | Nightly database dump & Supabase storage image archives |

---

## ⚡ 2. Preventing Unnecessary Redeployments (Selective Builds)

In a monorepo, changing a backend file should **never** trigger a frontend deployment, and vice-versa. Here is where to find and configure the exact fields in both platform dashboards:

---

### A. Vercel (Front-end Only)

#### 📍 Step 1: Set Root Directory
1. Go to your **[Vercel Dashboard](https://vercel.com)**.
2. Select your project: **`laxmi-furnitures-electronics`**.
3. Go to **Settings** (top navigation tab) > **General** (left sidebar).
4. Scroll down to the **Root Directory** card:
   * **Root Directory**: `Furniture-and-Electronics`
   * **Include files outside the root directory in the Build Step**: `Disabled` (toggle OFF)
   * **Skip deployments when there are no changes to the root directory or its dependencies**: `Enabled` (toggle ON)
5. Click **Save**.

#### 📍 Step 2: Configure Custom Ignored Build Step
1. In the same project **Settings**, click on **Git** in the left sidebar.
2. Scroll down to the **Ignored Build Step** section.
3. Set **Behavior** to: `Custom`.
4. In the **Command** field, enter:
   ```bash
   git diff --quiet HEAD^ HEAD ./
   ```
5. Click **Save**.

> **How it works:** Whenever a commit is pushed to `master`, Vercel runs this command inside `Furniture-and-Electronics/`. If no files changed inside `./`, the command exits with code `0`, and Vercel immediately cancels the deployment without consuming build minutes.

---

### B. Northflank (WhatsApp Bot Only)

#### 📍 Exact Location to Configure:
1. Go to your **[Northflank Dashboard](https://app.northflank.com)**.
2. Open your project (e.g. `Default`) and click on your combined service: **`lfe-whatsapp-bot`**.
3. In the left-hand sidebar menu under the **Build** section, click on **`Build options`**.
4. In the main page, find the **Configure build options** section.
5. Click to expand **`> Advanced build settings`** (accordion located directly below the blue Dockerfile card).
6. Configure the following fields:
   * **Path rules**: Click the **`Allow`** button (switch from `Ignore` to `Allow`).
   * **Rule box (Line 1)**: Enter:
     ```
     whatsapp-bot/**
     ```
   * **Commit message ignore flags**: Check ☑️ **`Enable commit message ignore flags`** *(Automatically respects `[skip ci]` in commits)*.
   * **Empty commit handling**: Check ☑️ **`Skip builds for empty commits`**.
7. Scroll down to the bottom of the page and click the blue **`Update build options`** button.

> **How it works:** By setting Path rules to **`Allow`** with `whatsapp-bot/**`, Northflank will **ONLY** trigger a rebuild when files inside the `whatsapp-bot/` directory are modified. Commits affecting `Furniture-and-Electronics/`, `scripts/`, `.github/`, or markdown files will be completely ignored!

---

## 🛡️ 3. Isolated Backup Branches (GitHub Actions)

Nightly automated backups run via GitHub Actions:
1. **Neon PostgreSQL Database**: `.github/workflows/db-backup.yml`
2. **Supabase Storage Images**: `.github/workflows/supabase-storage-backup.yml`

### Why They Never Trigger Vercel or Northflank:
* Backups are pushed strictly to **isolated Git branches**:
  * Database `.sql` dumps are committed to: `database-backups`
  * Supabase `.tar.gz` archives are committed to: `storage-backups`
* Because Vercel and Northflank only track and listen to the **`master`** branch, nightly automated backups will **never trigger a build** on either platform.
* Commit messages contain `[skip ci]`, providing a second layer of defense against accidental builds.
* Both workflows enforce a **10-day retention policy** (`-mtime +10`) to automatically prune older files and keep repository storage minimal.

---

## 🔧 4. Database Resilience & Self-Healing

The WhatsApp microservice runs standalone on Northflank and connects directly to Neon PostgreSQL.

### Best Practices Implemented in `whatsapp-bot/db.js`:
1. **Explicit Schema Qualification**: All SQL queries explicitly target `public."whatsapp_settings"` and `public."whatsapp_audit_logs"`. This avoids schema search path mismatches across different PostgreSQL pool connections.
2. **Auto-Bootstrap (`ensureTableExists`)**: Before executing any query (`getSettings`, `updateSettings`, or audit logs), the bot ensures that the necessary tables and columns exist (`CREATE TABLE IF NOT EXISTS public."whatsapp_settings"`). If a database branch or table is ever recreated, the service self-heals without throwing 500 errors.
3. **Dead-Man Switch**: The bot respects user-triggered disconnects (`status = 'disconnected'`) to prevent infinite connection loops upon container restarts.

---

## 📋 5. Quick Verification Checklist

When making future changes to the repository:
- Editing **Frontend UI or Next.js APIs** (`Furniture-and-Electronics/`): Only **Vercel** deploys.
- Editing **WhatsApp Bot code** (`whatsapp-bot/`): Only **Northflank** deploys.
- Editing **Documentation or Disaster Recovery Scripts** (`scripts/`): **Neither** platform deploys.
- Nightly backups running at 00:00 & 00:30 UTC: **Neither** platform deploys.
