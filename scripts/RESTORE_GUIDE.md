# 🔄 Database & Storage Disaster Recovery Guide

This guide explains step-by-step how to restore both your **Neon Database** and **Supabase Storage Images** from the automated nightly backups stored on GitHub.

---

## 🗄️ PART 1: Restore Neon PostgreSQL Database (`.sql`)

Every night at midnight, an automated dump of your database is created and saved as a `.sql` file on the `database-backups` branch.

### Step 1: Download the Backup File
1. Open your repository on GitHub.
2. Click the branch selector dropdown (top left, currently `master`) and select **`database-backups`**.
3. Open the `db-backups/` folder and click on the newest file: `backup-YYYY-MM-DD_HH-mm-ss.sql`.
4. Click the **Download** button (top right of the file preview) to save it to your computer.

---

### Step 2: Restore Options

#### 🟢 Option A: Neon SQL Editor (Easiest & Recommended — No Terminal Needed)
1. Open your [Neon Console](https://console.neon.tech).
2. Open your project: **`laxmi F&E`**.
3. In the top-left dropdown, ensure your **`production`** branch is selected.
4. Click **SQL Editor** in the left sidebar.
5. Open the downloaded `.sql` file on your computer using any text editor (Notepad, VS Code, etc.).
6. Select everything (`Ctrl + A`) and Copy (`Ctrl + C`).
7. Paste the entire SQL script directly into the Neon SQL Editor.
8. Click the green **Run** button (or press `Ctrl + Enter`).
9. ✅ **Done!** Neon will rebuild all your tables, indexes, constraints, and data in just a few seconds.

---

#### 🔵 Option B: Restore via Terminal (Docker / psql)
If you prefer restoring via the command line:
```bash
# Windows PowerShell:
docker run --rm -v ${PWD}:/work -w /work postgres:18-alpine psql "YOUR_DATABASE_URL" -f "path/to/backup.sql"

# Linux / macOS:
docker run --rm -v $(pwd):/work -w /work postgres:18-alpine psql "$DATABASE_URL" -f "path/to/backup.sql"
```

---

## 🖼️ PART 2: Restore Supabase Storage Images (`.tar.gz`)

Every night at 00:30 UTC, all booking design photos in the `laxmi-designs` bucket are backed up into an archive on the `storage-backups` branch.

### Step 1: Download the Image Backup File
1. Open your repository on GitHub.
2. Click the branch selector dropdown and select **`storage-backups`**.
3. Open the `storage-backups/` folder and click on the newest file: `storage-backup-YYYY-MM-DD_HH-mm-ss.tar.gz`.
4. Click **Download** to save it to your machine.

---

### Step 2: Required Credentials
The restore script requires your Supabase credentials to access the Storage API:
- **`SUPABASE_URL`**: `https://pueggvcwhpxoxyltjxqt.supabase.co`
- **`SUPABASE_SECRET_KEY`**: Your Supabase service role / secret key (`sb_secret_...`)

---

### Step 3: Run the Restore Script

Stay on the **`master`** branch in your project root where `scripts/restore-supabase-storage.js` is located.

#### 🪟 Windows (PowerShell):
Set the environment variables and run the script:
```powershell
$env:SUPABASE_URL="https://pueggvcwhpxoxyltjxqt.supabase.co"
$env:SUPABASE_SECRET_KEY="YOUR_SUPABASE_SECRET_KEY_HERE"

node scripts/restore-supabase-storage.js "C:\path\to\downloaded\storage-backup-XXXX.tar.gz"
```

#### 🐧 Linux / macOS / Git Bash (Single-Line Command):
You can include the variables directly in the command:
```bash
SUPABASE_URL="https://pueggvcwhpxoxyltjxqt.supabase.co" SUPABASE_SECRET_KEY="YOUR_SUPABASE_SECRET_KEY_HERE" node scripts/restore-supabase-storage.js path/to/storage-backup-XXXX.tar.gz
```

---

### Step 4: What the Restore Script Does Automatically:
1. **Auto-Checks Bucket**: Checks if `laxmi-designs` bucket exists. If deleted or missing, it automatically recreates it as a **Public** bucket with the 5 MB limit.
2. **Maintains Folder Hierarchy**: It extracts all images and preserves their exact folder structure:
   ```
   laxmi-designs/
   └── bookings/
       ├── BK-2026-001/
       │   └── 1732100000_sample_bed.jpg
       └── BK-2026-002/
           └── 1732105500_sofa_design.jpg
   ```
3. **Restores Exact Paths**: Uploads each image to its exact previous path with `x-upsert: true`.
4. **Zero Broken Links**: Because the URLs and paths are identical, **every booking photo link already stored in your Neon database works immediately!**

---

## 📌 Summary Checklist
| Service | Backup Branch | File Format | Restore Method |
| :--- | :--- | :--- | :--- |
| **Neon Database** | `database-backups` | `.sql` | Paste into **Neon SQL Editor** & click **Run** |
| **Supabase Images** | `storage-backups` | `.tar.gz` | Run `node scripts/restore-supabase-storage.js <file>` with `SUPABASE_SECRET_KEY` |
