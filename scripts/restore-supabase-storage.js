/**
 * Supabase Storage Disaster Recovery / Restore Script
 *
 * Recreates the Supabase Storage bucket ("laxmi-designs") if missing,
 * unpacks the chosen backup archive, and uploads all images back to Supabase Storage
 * preserving their EXACT original relative folder structure (e.g. bookings/BK-001/photo.jpg).
 *
 * Usage:
 *   node scripts/restore-supabase-storage.js [optional_path_to_archive.tar.gz]
 *
 * If no argument is passed, it automatically selects the latest archive from storage-backups/.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://pueggvcwhpxoxyltjxqt.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY || '';
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'laxmi-designs';

const BACKUP_DIR = path.resolve(process.env.BACKUP_OUTPUT_DIR || path.join(__dirname, '..', 'storage-backups'));
const RESTORE_TEMP = path.join(BACKUP_DIR, '.temp_restore');

if (!SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_SECRET_KEY (or SUPABASE_KEY) is required to restore storage.');
  console.error('   Please run with SUPABASE_SECRET_KEY=sb_secret_... node scripts/restore-supabase-storage.js');
  process.exit(1);
}

// MIME type detection helper
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

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

// Ensure the bucket exists (create it with public access if missing)
async function ensureBucketExists() {
  console.log(`🔍 Checking if bucket "${BUCKET_NAME}" exists in Supabase...`);
  const checkRes = await supabaseFetch(`/bucket/${BUCKET_NAME}`);

  if (checkRes.ok) {
    console.log(`✅ Bucket "${BUCKET_NAME}" exists.`);
    return;
  }

  if (checkRes.status === 404) {
    console.log(`⚙️ Bucket "${BUCKET_NAME}" not found. Creating public bucket...`);
    const createRes = await supabaseFetch('/bucket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: BUCKET_NAME,
        name: BUCKET_NAME,
        public: true,
        file_size_limit: 5242880, // 5MB limit matching production
        allowed_mime_types: ['image/*'],
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text().catch(() => '');
      throw new Error(`Failed to create bucket "${BUCKET_NAME}": ${createRes.status} ${errText}`);
    }
    console.log(`✅ Bucket "${BUCKET_NAME}" successfully created as PUBLIC.`);
  } else {
    const errText = await checkRes.text().catch(() => '');
    throw new Error(`Error verifying bucket "${BUCKET_NAME}": ${checkRes.status} ${errText}`);
  }
}

// Upload a single file preserving its relative storage path
async function uploadFile(relativePath, localFilePath) {
  const fileBuffer = fs.readFileSync(localFilePath);
  const mimeType = getMimeType(localFilePath);

  // Normalize path separators to forward slashes for URLs/Storage
  const storagePath = relativePath.replace(/\\/g, '/');

  const uploadEndpoint = `/object/${BUCKET_NAME}/${storagePath}`;

  const res = await supabaseFetch(uploadEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: fileBuffer,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to upload ${storagePath}: ${res.status} ${errText}`);
  }
}

// Recursively find all files in extracted directory
function getAllFiles(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, filePath);
      // Skip the manifest metadata file
      if (relativePath !== 'manifest.json') {
        results.push({ relativePath, localFilePath: filePath });
      }
    }
  }

  return results;
}

// Find newest archive in storage-backups/
function findLatestArchive() {
  if (!fs.existsSync(BACKUP_DIR)) return null;

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('storage-backup-') && f.endsWith('.tar.gz'))
    .sort()
    .reverse();

  return files.length > 0 ? path.join(BACKUP_DIR, files[0]) : null;
}

async function runRestore() {
  let targetArchive = process.argv[2];

  if (!targetArchive) {
    targetArchive = findLatestArchive();
  }

  if (!targetArchive || !fs.existsSync(targetArchive)) {
    console.error(`❌ Error: Backup archive not found: ${targetArchive || '(no archives in storage-backups/)'}`);
    console.log(`\nUsage: node scripts/restore-supabase-storage.js [path/to/storage-backup-*.tar.gz]`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`🚀 Supabase Storage Disaster Recovery / Restore`);
  console.log(`📦 Archive: ${path.basename(targetArchive)}`);
  console.log(`🪣 Target Bucket: ${BUCKET_NAME}`);
  console.log(`🌐 Supabase URL: ${SUPABASE_URL}`);
  console.log(`======================================================\n`);

  // Ensure bucket exists in Supabase
  await ensureBucketExists();

  // Extract archive to temporary folder
  if (fs.existsSync(RESTORE_TEMP)) {
    fs.rmSync(RESTORE_TEMP, { recursive: true, force: true });
  }
  fs.mkdirSync(RESTORE_TEMP, { recursive: true });

  try {
    console.log(`📂 Extracting archive contents...`);
    execSync(`tar -xzf "${targetArchive}" -C "${RESTORE_TEMP}"`, { stdio: 'inherit' });

    const filesToUpload = getAllFiles(RESTORE_TEMP);
    console.log(`📑 Found ${filesToUpload.length} file(s) to restore in original folder structure.\n`);

    if (filesToUpload.length === 0) {
      console.log('ℹ️ No images to restore in this archive.');
    } else {
      let count = 0;
      for (const file of filesToUpload) {
        count++;
        const displayPath = file.relativePath.replace(/\\/g, '/');
        process.stdout.write(`   [${count}/${filesToUpload.length}] Restoring: ${displayPath}... `);
        await uploadFile(file.relativePath, file.localFilePath);
        console.log(`✅ OK`);
      }
    }

    // Clean up temporary extracted files
    fs.rmSync(RESTORE_TEMP, { recursive: true, force: true });

    console.log(`\n======================================================`);
    console.log(`🎉 RESTORE COMPLETED SUCCESSFULLY!`);
    console.log(`✅ All ${filesToUpload.length} files restored to "${BUCKET_NAME}".`);
    console.log(`🔗 Every booking photo URL in your database is now 100% active.`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error(`\n❌ Storage restore failed:`, err.message);
    if (fs.existsSync(RESTORE_TEMP)) {
      fs.rmSync(RESTORE_TEMP, { recursive: true, force: true });
    }
    process.exit(1);
  }
}

runRestore();
