const { logger, MAX_RECONNECT_ATTEMPTS } = require('./config');
const { getSettings, updateSettings } = require('./db');
const { usePostgresAuthState, clearPostgresSession } = require('./pg-auth');

let globalSocket = null;
let isInitializing = false;
let cachedWaVersion = null;
let globalConnectionTimeout = null;
let reconnectTimer = null;
let reconnectAttempts = 0;

async function initWhatsappSocket() {
  clearTimeout(reconnectTimer);
  clearTimeout(globalConnectionTimeout);

  if (isInitializing) {
    console.log('⏳ WhatsApp initialization already in progress, skipping...');
    return;
  }

  isInitializing = true;
  console.log('🚀 Starting WhatsApp connection...');

  try {
    const baileys = await import('@whiskeysockets/baileys');
    const makeWASocket = baileys.default;
    const { DisconnectReason, fetchLatestBaileysVersion, Browsers } = baileys;

    const settings = await getSettings();

    // Dead-man switch: do not auto-start if explicitly disconnected
    if (settings.status === 'disconnected') {
      console.log('🛑 DB is set to disconnected. Aborting startup to prevent zombie loops.');
      isInitializing = false;
      reconnectAttempts = 0;
      return;
    }

    await updateSettings(settings.id, { status: 'connecting', qr_code: null });

    const { state, saveCreds } = await usePostgresAuthState(baileys);

    let versionToUse = cachedWaVersion;
    if (!versionToUse) {
      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.log(`📱 Fetched WhatsApp protocol v${version.join('.')}, isLatest: ${isLatest}`);
      cachedWaVersion = version;
      versionToUse = version;
    } else {
      console.log(`📱 Using cached WhatsApp protocol v${versionToUse.join('.')}`);
    }

    const sock = makeWASocket({
      version: versionToUse,
      auth: state,
      browser: Browsers.ubuntu('Chrome'),
      logger: logger,
      fireInitQueries: false,
      syncFullHistory: false, // Prevent high memory usage / OOM
      markOnlineOnConnect: false,
    });

    globalSocket = sock;

    // 90-second watchdog timer for scanning QR code
    globalConnectionTimeout = setTimeout(async () => {
      if (globalSocket === sock) {
        console.log('⏱️ WhatsApp QR pairing timed out after 90s. Terminating socket...');
        try { globalSocket.end(undefined); } catch (e) { /* ignore */ }
        globalSocket = null;
        reconnectAttempts = 0;
        await clearPostgresSession();
        await updateSettings(settings.id, { status: 'disconnected', qr_code: null });
      }
    }, 90000);

    sock.ev.on('creds.update', saveCreds);

    // Ignore history sync to avoid memory pressure
    sock.ev.on('messaging-history.set', () => {});

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('📱 New WhatsApp QR code generated!');
        await updateSettings(settings.id, { status: 'connecting', qr_code: qr });
      }

      if (connection === 'open') {
        clearTimeout(globalConnectionTimeout);
        reconnectAttempts = 0;
        console.log('✅ WhatsApp connected successfully!');

        let ownerPhone = undefined;
        let ownerName = undefined;

        if (sock.user && sock.user.id) {
          const rawJid = sock.user.id;
          const numOnly = rawJid.split(':')[0].split('@')[0];
          // Normalize Indian 12-digit number (91xxxxxxxxxx -> xxxxxxxxxx)
          ownerPhone = (numOnly.length === 12 && numOnly.startsWith('91')) ? numOnly.slice(2) : numOnly;
          ownerName = sock.user.name || sock.user.notify || sock.user.verifiedName || '';
          console.log(`👤 Paired WhatsApp account: ${ownerName ? ownerName + ' ' : ''}(${ownerPhone})`);
        }

        await updateSettings(settings.id, {
          status: 'connected',
          qr_code: null,
          ...(ownerPhone ? { owner_phone: ownerPhone } : {}),
          ...(ownerName !== undefined ? { owner_name: ownerName } : {}),
        });
      }

      if (connection === 'close') {
        clearTimeout(globalConnectionTimeout);
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(`❌ WhatsApp disconnected (code: ${statusCode}).`);

        if (globalSocket !== sock) {
          console.log('🛑 Socket was replaced or manually killed.');
          reconnectAttempts = 0;
          await updateSettings(settings.id, { status: 'disconnected', qr_code: null });
          return;
        }

        if (statusCode === DisconnectReason.loggedOut) {
          console.log('🛑 Session logged out from device. Clearing session from PostgreSQL.');
          globalSocket = null;
          isInitializing = false;
          reconnectAttempts = 0;
          await clearPostgresSession();
          await updateSettings(settings.id, { status: 'disconnected', qr_code: null });
        } else {
          // Transient disconnect or 515 handshake restart: retry without wiping DB session
          reconnectAttempts++;
          if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
            console.log(`🛑 Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached (code: ${statusCode}). Stopping reconnects.`);
            globalSocket = null;
            isInitializing = false;
            reconnectAttempts = 0;
            await updateSettings(settings.id, { status: 'disconnected', qr_code: null });
          } else {
            console.log(`🔄 Reconnecting in 5s (code: ${statusCode}, attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            isInitializing = false;
            reconnectTimer = setTimeout(() => initWhatsappSocket(), 5000);
          }
        }
      }
    });

    isInitializing = false;
  } catch (error) {
    isInitializing = false;
    console.error('❌ WhatsApp initialization failed:', error);
    throw error;
  }
}

async function disconnectWhatsapp() {
  clearTimeout(globalConnectionTimeout);
  clearTimeout(reconnectTimer);
  reconnectAttempts = 0;

  if (globalSocket) {
    try {
      globalSocket.end(undefined);
    } catch (e) {
      console.error('Error closing socket:', e.message);
    }
    globalSocket = null;
  }

  isInitializing = false;

  const settings = await getSettings();
  await updateSettings(settings.id, { status: 'disconnected', qr_code: null });
  await clearPostgresSession();
  console.log('✅ WhatsApp disconnected and PostgreSQL session cleared.');
}

function getGlobalSocket() {
  return globalSocket;
}

module.exports = {
  initWhatsappSocket,
  disconnectWhatsapp,
  getGlobalSocket,
  clearPostgresSession,
};

