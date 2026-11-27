const { pool } = require('./db');

const DEFAULT_SESSION_ID = 'default';

/**
 * Deletes all stored WhatsApp auth state rows so there is never more than one session.
 */
async function clearPostgresSession(sessionId = DEFAULT_SESSION_ID) {
  try {
    await pool.query('DELETE FROM public."whatsapp_auth_state" WHERE session_id = $1', [
      sessionId,
    ]);
    console.log('🧹 PostgreSQL WhatsApp session cleared.');
  } catch (err) {
    console.warn('Warning clearing PostgreSQL WhatsApp session:', err.message);
  }
}

/**
 * Baileys-compatible PostgreSQL auth state adapter with in-memory read cache
 * and single-roundtrip batched writes so pairing never hits pre-key timeouts.
 */
async function usePostgresAuthState(baileys, sessionId = DEFAULT_SESSION_ID) {
  const { initAuthCreds, BufferJSON, proto } = baileys;
  const cache = new Map();

  // Preload all keys for this session in a single query
  const res = await pool.query(
    'SELECT key_id, value FROM public."whatsapp_auth_state" WHERE session_id = $1',
    [sessionId]
  );

  for (const row of res.rows) {
    try {
      const parsed = JSON.parse(JSON.stringify(row.value), BufferJSON.reviver);
      cache.set(row.key_id, parsed);
    } catch (err) {
      console.warn(`Failed to parse auth key ${row.key_id}:`, err.message);
    }
  }

  const writeKey = async (keyId, data) => {
    cache.set(keyId, data);
    const serialized = JSON.stringify(data, BufferJSON.replacer);
    await pool.query(
      `INSERT INTO public."whatsapp_auth_state" (session_id, key_id, value, updated_at)
       VALUES ($1, $2, $3::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (session_id, key_id)
       DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [sessionId, keyId, serialized]
    );
  };

  const creds = cache.get('creds') || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const result = {};
          for (const id of ids) {
            let value = cache.get(`${type}-${id}`) ?? null;
            if (type === 'app-state-sync-key' && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            result[id] = value;
          }
          return result;
        },
        set: async (data) => {
          const upsertKeyIds = [];
          const upsertValues = [];
          const deleteKeyIds = [];

          for (const category of Object.keys(data)) {
            const entries = data[category] || {};
            for (const id of Object.keys(entries)) {
              const value = entries[id];
              const keyId = `${category}-${id}`;
              if (value) {
                cache.set(keyId, value);
                upsertKeyIds.push(keyId);
                upsertValues.push(JSON.stringify(value, BufferJSON.replacer));
              } else {
                cache.delete(keyId);
                deleteKeyIds.push(keyId);
              }
            }
          }

          if (upsertKeyIds.length === 0 && deleteKeyIds.length === 0) return;

          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            if (upsertKeyIds.length > 0) {
              await client.query(
                `INSERT INTO public."whatsapp_auth_state" (session_id, key_id, value, updated_at)
                 SELECT $1, k, v::jsonb, CURRENT_TIMESTAMP
                 FROM UNNEST($2::text[], $3::text[]) AS t(k, v)
                 ON CONFLICT (session_id, key_id)
                 DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
                [sessionId, upsertKeyIds, upsertValues]
              );
            }
            if (deleteKeyIds.length > 0) {
              await client.query(
                'DELETE FROM public."whatsapp_auth_state" WHERE session_id = $1 AND key_id = ANY($2::text[])',
                [sessionId, deleteKeyIds]
              );
            }
            await client.query('COMMIT');
          } catch (err) {
            await client.query('ROLLBACK').catch(() => {});
            throw err;
          } finally {
            client.release();
          }
        },
      },
    },
    saveCreds: async () => {
      await writeKey('creds', creds);
    },
  };
}

module.exports = {
  usePostgresAuthState,
  clearPostgresSession,
};
