/**
 * Supabase Storage Automated Backup Script
 *
 * Recursively downloads all files from the Supabase Storage bucket ("laxmi-designs"),
 * preserves the exact subfolder structure (e.g., bookings/BK-001/photo.jpg),
 * packages them into a dated .tar.gz archive, and removes archives older than 10 days.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://pueggvcwhpxoxyltjxqt.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'laxmi-designs';
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '10', 10);

const BACKUP_DIR = path.resolve(process.env.BACKUP_OUTPUT_DIR || path.join(__dirname, '..', 'storage-backups'));
const TEMP_DIR = path.join(BACKUP_DIR, '.temp_download');

if (!SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_SECRET_KEY (or SUPABASE_KEY) is not set in environment.');
  process.exit(1);
}

// Helper to make authenticated fetch requests to Supabase Storage
async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/storage/v1${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
      ...(options.headers || {}),
    },
  });
  return res;
}

// Recursively list all files and subfolders in bucket
async function listAllFilesRecursively(prefix = '') {
  const files = [];

  const res = await supabaseFetch(`/object/list/${BUCKET_NAME}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prefix,
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Failed to list bucket objects at "${prefix}": ${res.status} ${errorText}`);
  }

  const items = await res.json();
  if (!Array.isArray(items)) return files;

  for (const item of items) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

    // In Supabase Storage, a subfolder is identified by null id or metadata
    const isFolder = item.id === null || !item.metadata;

    if (isFolder) {
      const subFiles = await listAllFilesRecursively(fullPath);
      files.push(...subFiles);
    } else {
      files.push({
        name: item.name,
        path: fullPath,
        size: item.metadata?.size || 0,
        mimetype: item.metadata?.mimetype || 'application/octet-stream',
      });
    }
  }

  return files;
}

// Download a single file to target disk path
async function downloadFile(storagePath, localDestination) {
  fs.mkdirSync(path.dirname(localDestination), { recursive: true });

  const res = await supabaseFetch(`/object/${BUCKET_NAME}/${storagePath}`);
  if (!res.ok) {
    throw new Error(`Failed to download ${storagePath} (${res.status})`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(localDestination, buffer);
}

// Clean up archives older than RETENTION_DAYS
function cleanupOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;

  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const maxAgeMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

  let cleanedCount = 0;
  for (const file of files) {
    if (file.startsWith('storage-backup-') && (file.endsWith('.tar.gz') || file.endsWith('.zip'))) {
      const filePath = path.join(BACKUP_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        console.log(`🧹 Cleaned up old storage backup (> ${RETENTION_DAYS} days): ${file}`);
        cleanedCount++;
      }
    }
  }

  if (cleanedCount === 0) {
    console.log(`✨ No backups older than ${RETENTION_DAYS} days to remove.`);
  }
}

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const archiveName = `storage-backup-${timestamp}.tar.gz`;
  const archivePath = path.join(BACKUP_DIR, archiveName);

  console.log(`\n======================================================`);
  console.log(`📦 Supabase Storage Backup Started`);
  console.log(`🪣 Bucket: ${BUCKET_NAME}`);
  console.log(`🌐 Supabase URL: ${SUPABASE_URL}`);
  console.log(`======================================================\n`);

  // Ensure directories exist
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  try {
    console.log(`🔍 Scanning bucket "${BUCKET_NAME}" for files...`);
    const files = await listAllFilesRecursively();
    console.log(`📑 Found ${files.length} file(s) in bucket.`);

    if (files.length === 0) {
      console.log('ℹ️ Bucket is currently empty. Writing empty backup manifest.');
      fs.writeFileSync(
        path.join(TEMP_DIR, 'manifest.json'),
        JSON.stringify({ bucket: BUCKET_NAME, backedUpAt: new Date().toISOString(), filesCount: 0 }, null, 2)
      );
    } else {
      console.log(`⬇️ Downloading files and preserving directory hierarchy...`);
      let count = 0;
      for (const file of files) {
        const dest = path.join(TEMP_DIR, file.path);
        await downloadFile(file.path, dest);
        count++;
        console.log(`   [${count}/${files.length}] Downloaded: ${file.path}`);
      }

      // Write metadata manifest
      fs.writeFileSync(
        path.join(TEMP_DIR, 'manifest.json'),
        JSON.stringify(
          {
            bucket: BUCKET_NAME,
            backedUpAt: new Date().toISOString(),
            filesCount: files.length,
            files: files.map((f) => ({ path: f.path, size: f.size, mimetype: f.mimetype })),
          },
          null,
          2
        )
      );
    }

    console.log(`\n🗜️ Creating archive: ${archiveName}...`);
    // Create tar.gz archive preserving relative paths
    execSync(`tar -czf "${archivePath}" -C "${TEMP_DIR}" .`, { stdio: 'inherit' });

    const archiveStat = fs.statSync(archivePath);
    console.log(`✅ Storage backup completed successfully!`);
    console.log(`📁 Archive: ${archivePath} (${(archiveStat.size / (1024 * 1024)).toFixed(2)} MB)`);

    // Clean up temporary download folder
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });

    // Enforce 10-day retention
    console.log(`\n🧹 Checking for backups older than ${RETENTION_DAYS} days...`);
    cleanupOldBackups();

    console.log(`\n🎉 Backup process finished successfully!\n`);
  } catch (err) {
    console.error(`\n❌ Storage backup failed:`, err.message);
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    process.exit(1);
  }
}

runBackup();
