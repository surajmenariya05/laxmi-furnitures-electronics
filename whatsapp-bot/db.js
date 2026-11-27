const { Pool } = require('pg');
const { DATABASE_URL } = require('./config');

const pool = new Pool({ connectionString: DATABASE_URL });

let tableInitialized = false;

// Ensure tables and columns exist automatically on startup or before first query
async function ensureTableExists() {
  if (tableInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public."whatsapp_settings" (
        id SERIAL PRIMARY KEY,
        owner_phone VARCHAR(50) DEFAULT '8209399683',
        owner_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'disconnected',
        qr_code TEXT,
        simulate_failures BOOLEAN DEFAULT false,
        simulate_session_error BOOLEAN DEFAULT false
      );
      ALTER TABLE public."whatsapp_settings" ADD COLUMN IF NOT EXISTS "owner_name" text;
      CREATE TABLE IF NOT EXISTS public."whatsapp_audit_logs" (
        id SERIAL PRIMARY KEY,
        bill_id INTEGER,
        bill_number VARCHAR(100),
        event VARCHAR(100),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS public."whatsapp_auth_state" (
        session_id VARCHAR(64) NOT NULL DEFAULT 'default',
        key_id TEXT NOT NULL,
        value JSONB NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id, key_id)
      );
    `);
    tableInitialized = true;
  } catch (err) {
    console.warn('Notice ensuring whatsapp tables:', err.message);
  }
}

// Initial bootstrap check
ensureTableExists().catch(e => console.warn('Bootstrap table check:', e.message));

async function getSettings() {
  await ensureTableExists();
  const res = await pool.query('SELECT * FROM public."whatsapp_settings" ORDER BY id ASC LIMIT 1');
  if (res.rows.length === 0) {
    const created = await pool.query(`
      INSERT INTO public."whatsapp_settings" (owner_phone, status, simulate_failures, simulate_session_error)
      VALUES ('8209399683', 'disconnected', false, false)
      RETURNING *
    `);
    return created.rows[0];
  }
  return res.rows[0];
}

async function updateSettings(id, data) {
  await ensureTableExists();
  const setClauses = [];
  const values = [];
  let idx = 1;

  if (data.status !== undefined) {
    setClauses.push(`status = $${idx++}`);
    values.push(data.status);
  }
  if (data.qr_code !== undefined) {
    setClauses.push(`qr_code = $${idx++}`);
    values.push(data.qr_code);
  }
  if (data.owner_phone !== undefined) {
    setClauses.push(`owner_phone = $${idx++}`);
    values.push(data.owner_phone);
  }
  if (data.owner_name !== undefined) {
    setClauses.push(`owner_name = $${idx++}`);
    values.push(data.owner_name);
  }

  if (setClauses.length === 0) return;
  values.push(id);

  const query = `UPDATE public."whatsapp_settings" SET ${setClauses.join(', ')} WHERE id = $${idx}`;
  await pool.query(query, values);
}

async function logAuditEvent(billId, billNumber, event, details) {
  try {
    await ensureTableExists();
    await pool.query(`
      INSERT INTO public."whatsapp_audit_logs" (bill_id, bill_number, event, details)
      VALUES ($1, $2, $3, $4)
    `, [billId, billNumber, event, details]);
  } catch (err) {
    console.error('Failed to write audit event:', err.message);
  }
}

module.exports = {
  pool,
  getSettings,
  updateSettings,
  logAuditEvent,
};

