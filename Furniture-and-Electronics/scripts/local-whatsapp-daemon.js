/**
 * Local WhatsApp Daemon (Development Only)
 *
 * Runs a local Baileys WhatsApp client on your machine for testing messaging and PDF dispatch.
 * 
 * SAFETY RULES:
 * 1. Only loads credentials from .env.local (IGNORES .env).
 * 2. Silently aborts if running on Vercel or in production environments.
 * 3. Never interferes with production microservice (Northflank).
 */

const path = require('path');
const fs = require('fs');

// ─── 1. Vercel & Production Environment Protection Lock ──────────
if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
  console.log('🛑 Production / Vercel environment detected. Local WhatsApp daemon is disabled.');
  process.exit(0);
}

// ─── 2. Explicitly Load .env.local ONLY ───────────────────────────
const envLocalPath = path.resolve(__dirname, '..', '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.warn('⚠️ No .env.local file found. Local daemon will use environment variables already present in process.');
} else {
  // Clear any existing values to ensure ONLY .env.local takes precedence
  require('dotenv').config({ path: envLocalPath });
  console.log(`🔒 Loaded configuration exclusively from: ${envLocalPath}`);
}

const http = require('http');

let logger;
try {
  const pino = require('pino');
  logger = pino({ level: 'warn' });
} catch {
  logger = {
    info: () => {},
    warn: () => {},
    error: console.error,
    debug: () => {},
    trace: () => {},
    child: () => logger,
  };
}

let qrcodeTerminal = null;
try {
  qrcodeTerminal = require('qrcode-terminal');
} catch (e) {}

// ─── 3. Configuration ────────────────────────────────────────────
const PORT = parseInt(process.env.WHATSAPP_LOCAL_PORT || '3001', 10);
const sessionDir = path.resolve(__dirname, '..', '.whatsapp-sessions');

// ─── 4. Global WhatsApp Socket State ─────────────────────────────
let globalSocket = null;
let isInitializing = false;
let currentStatus = 'disconnected'; // 'disconnected' | 'connecting' | 'connected'
let currentQrCode = null;
let currentOwnerPhone = 'Local Testing';
let currentOwnerName = null;
let cachedWaVersion = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

function clearSessionFiles() {
  if (fs.existsSync(sessionDir)) {
    try {
      for (const entry of fs.readdirSync(sessionDir)) {
        fs.rmSync(path.join(sessionDir, entry), { recursive: true, force: true });
      }
      console.log('🧹 Local WhatsApp session files cleared.');
    } catch (e) {
      console.warn('Warning clearing session files:', e.message);
    }
  } else {
    fs.mkdirSync(sessionDir, { recursive: true });
  }
}

// ─── 5. Baileys WhatsApp Daemon ──────────────────────────────────
async function initWhatsappSocket() {
  if (isInitializing) {
    console.log('⏳ Local WhatsApp initialization already in progress...');
    return;
  }

  isInitializing = true;
  currentStatus = 'connecting';
  currentQrCode = null;
  console.log('🚀 Starting local WhatsApp connection...');

  try {
    const baileys = await import('@whiskeysockets/baileys');
    const makeWASocket = baileys.default;
    const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = baileys;

    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    let versionToUse = cachedWaVersion;
    if (!versionToUse) {
      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.log(`📱 WhatsApp protocol v${version.join('.')}, isLatest: ${isLatest}`);
      cachedWaVersion = version;
      versionToUse = version;
    }

    const sock = makeWASocket({
      version: versionToUse,
      auth: state,
      browser: Browsers.macOS('Desktop'),
      logger: logger,
      fireInitQueries: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    globalSocket = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQrCode = qr;
        currentStatus = 'connecting';
        console.log('\n========================================================================');
        console.log('📲 QR CODE READY! Scan using your WhatsApp mobile app:');
        console.log(`   👉 Open in Browser: http://localhost:${PORT}/qr`);
        console.log('   (WhatsApp Settings > Linked Devices > Link a Device)');
        console.log('========================================================================\n');

        if (qrcodeTerminal) {
          try {
            qrcodeTerminal.generate(qr, { small: true });
          } catch (e) {}
        }
      }

      if (connection === 'open') {
        reconnectAttempts = 0;
        currentStatus = 'connected';
        currentQrCode = null;

        if (sock.user && sock.user.id) {
          const rawJid = sock.user.id;
          const numOnly = rawJid.split(':')[0].split('@')[0];
          currentOwnerPhone = (numOnly.length === 12 && numOnly.startsWith('91')) ? numOnly.slice(2) : numOnly;
          currentOwnerName = sock.user.name || sock.user.notify || sock.user.verifiedName || null;
        }

        console.log(`\n✅ Local WhatsApp connected successfully! Account: ${currentOwnerName || ''} (${currentOwnerPhone})\n`);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(`❌ WhatsApp socket closed (Status code: ${statusCode}).`);

        if (globalSocket !== sock) return;

        if (statusCode === 515) {
          // Code 515 = pairing restart
          reconnectAttempts++;
          if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
            console.log(`🛑 Max pairing reconnect attempts reached. Resetting session.`);
            globalSocket = null;
            isInitializing = false;
            reconnectAttempts = 0;
            currentStatus = 'disconnected';
            clearSessionFiles();
          } else {
            console.log(`🔄 Reconnecting local socket in 4s (pairing handshake ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            isInitializing = false;
            setTimeout(() => initWhatsappSocket(), 4000);
          }
        } else if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
          console.log('🛑 Local session was logged out or expired. Cleaned up stale files.');
          globalSocket = null;
          isInitializing = false;
          currentStatus = 'disconnected';
          clearSessionFiles();
          console.log('🔄 Restarting clean pairing session in 2s to generate fresh QR code...');
          setTimeout(() => initWhatsappSocket(), 2000);
        } else {
          globalSocket = null;
          isInitializing = false;
          currentStatus = 'disconnected';
        }
      }
    });

    isInitializing = false;
  } catch (error) {
    isInitializing = false;
    currentStatus = 'disconnected';
    console.error('❌ Failed to initialize local WhatsApp socket:', error);
  }
}

async function disconnectWhatsapp() {
  if (globalSocket) {
    try {
      globalSocket.end(undefined);
    } catch (e) { /* ignore */ }
    globalSocket = null;
  }
  isInitializing = false;
  currentStatus = 'disconnected';
  currentQrCode = null;
  clearSessionFiles();
  console.log('✅ Local WhatsApp disconnected.');
}

// ─── 5. Sequential Message Queue ─────────────────────────────────
// Ensures back-to-back documents (e.g. Booking Slip + Furniture Invoice)
// don't collide or drop on Baileys media streams.
let outgoingQueue = Promise.resolve();

function enqueueWhatsappMessage(sendFn) {
  const task = outgoingQueue.then(async () => {
    const result = await sendFn();
    // 2-second cooldown to let WhatsApp servers process each media attachment cleanly
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return result;
  });
  outgoingQueue = task.catch(() => {});
  return task;
}

async function sendWhatsappMessage(phone, text, pdfPath, pdfFilename, pdfBase64) {
  if (!globalSocket || currentStatus !== 'connected') {
    throw new Error('Local WhatsApp daemon is not connected. Call POST /connect and scan QR first.');
  }

  let jid = phone.replace(/[^0-9]/g, '');
  if (jid.length === 10) {
    jid = '91' + jid;
  }
  jid = jid + '@s.whatsapp.net';

  // Send PDF document if provided
  if ((pdfPath || pdfBase64) && pdfFilename) {
    let pdfBuffer;
    if (pdfBase64) {
      let cleanBase64 = String(pdfBase64);
      if (cleanBase64.includes('base64,')) {
        cleanBase64 = cleanBase64.split('base64,')[1];
      }
      cleanBase64 = cleanBase64.trim();
      pdfBuffer = Buffer.from(cleanBase64, 'base64');
    } else if (pdfPath?.startsWith('http')) {
      const response = await fetch(pdfPath);
      pdfBuffer = Buffer.from(await response.arrayBuffer());
    } else if (pdfPath && fs.existsSync(pdfPath)) {
      pdfBuffer = fs.readFileSync(pdfPath);
    }

    if (pdfBuffer && pdfBuffer.length > 0) {
      console.log(`📤 [Local WA] Dispatching PDF document to ${phone} (${pdfFilename}, ${pdfBuffer.length} bytes)...`);
      await globalSocket.sendMessage(jid, {
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: pdfFilename,
        caption: text,
      });
      console.log(`✅ [Local WA] Sent PDF document to ${phone} (${pdfFilename})`);
      return;
    }
  }

  // Text-only fallback
  console.log(`📤 [Local WA] Dispatching text message to ${phone}...`);
  await globalSocket.sendMessage(jid, { text });
  console.log(`✅ [Local WA] Sent message to ${phone}`);
}

// ─── 6. Native Node.js HTTP Server (Zero Dependencies) ─────────────
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // GET / or /qr -> Web QR Code Scanner Page
  if (req.method === 'GET' && (pathname === '/' || pathname === '/qr')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Laxmi WhatsApp QR Scanner</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    h1 { font-size: 20px; font-weight: 800; margin: 0 0 8px; color: #38bdf8; }
    p { font-size: 13px; color: #94a3b8; margin: 0 0 24px; line-height: 1.5; }
    .qr-box { background: white; padding: 16px; border-radius: 12px; display: inline-block; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .qr-box img { display: block; width: 280px; height: 280px; }
    .instructions { text-align: left; background: #0f172a; border-radius: 8px; padding: 14px 16px; font-size: 12px; color: #cbd5e1; }
    .instructions ol { margin: 0; padding-left: 20px; }
    .instructions li { margin-bottom: 6px; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; }
    .status-badge.connecting { background: rgba(234, 179, 8, 0.15); color: #facc15; border: 1px solid #eab308; }
    .status-badge.connected { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid #22c55e; }
  </style>
  <script>
    async function checkStatus() {
      try {
        const res = await fetch('/status');
        const data = await res.json();
        if (data.status === 'connected') {
          document.getElementById('content').innerHTML = \`
            <div class="status-badge connected">● WhatsApp Connected</div>
            <h1 style="color: #4ade80;">✅ Successfully Connected!</h1>
            <p>Your WhatsApp is linked and ready to dispatch booking slips and invoices.</p>
          \`;
        } else if (data.qrCode) {
          const img = document.getElementById('qr-img');
          const newSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=' + encodeURIComponent(data.qrCode);
          if (img && img.src !== newSrc) {
            img.src = newSrc;
          }
        }
      } catch (e) {}
    }
    setInterval(checkStatus, 2500);
  </script>
</head>
<body>
  <div class="card" id="content">
    <div class="status-badge connecting">● Waiting for QR Scan</div>
    <h1>Scan WhatsApp QR Code</h1>
    <p>Laxmi Electronics & Furnitures — Local Message Daemon</p>
    <div class="qr-box">
      ${
        currentQrCode
          ? `<img id="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(currentQrCode)}" alt="WhatsApp QR Code" />`
          : `<div style="width:280px;height:280px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:13px;">Generating QR code...</div>`
      }
    </div>
    <div class="instructions">
      <ol>
        <li>Open <b>WhatsApp</b> on your mobile phone</li>
        <li>Tap <b>Settings</b> (or 3 dots on Android)</li>
        <li>Select <b>Linked Devices</b> &gt; <b>Link a Device</b></li>
        <li>Point your phone's camera at this QR code</li>
      </ol>
    </div>
  </div>
</body>
</html>`);
  }

  // GET /health
  if (req.method === 'GET' && pathname === '/health') {
    return sendJson(res, 200, {
      status: 'ok',
      mode: 'local-development-daemon',
      whatsapp: currentStatus,
      uptime: process.uptime(),
    });
  }

  // GET /status
  if (req.method === 'GET' && pathname === '/status') {
    return sendJson(res, 200, {
      id: 1,
      ownerPhone: currentOwnerPhone,
      ownerName: currentOwnerName,
      status: currentStatus,
      qrCode: currentQrCode,
    });
  }

  // POST /connect
  if (req.method === 'POST' && pathname === '/connect') {
    try {
      if (globalSocket) {
        try { globalSocket.end(undefined); } catch (e) {}
        globalSocket = null;
      }
      isInitializing = false;
      reconnectAttempts = 0;
      initWhatsappSocket().catch(e => console.error(e));
      return sendJson(res, 200, {
        status: 'connecting',
        message: 'Local WhatsApp daemon started. Check terminal for QR code or poll /status.',
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // POST /disconnect
  if (req.method === 'POST' && pathname === '/disconnect') {
    try {
      await disconnectWhatsapp();
      return sendJson(res, 200, { status: 'disconnected', message: 'Local WhatsApp disconnected.' });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // POST /send
  if (req.method === 'POST' && pathname === '/send') {
    try {
      const body = await parseJsonBody(req);
      const { phone, text, pdfUrl, pdfFilename, pdfBase64 } = body;
      if (!phone || !text) {
        return sendJson(res, 400, { error: 'Missing required fields: phone, text' });
      }
      await enqueueWhatsappMessage(() =>
        sendWhatsappMessage(phone, text, pdfUrl, pdfFilename, pdfBase64)
      );
      return sendJson(res, 200, { success: true, message: `[Local WA] Delivered to ${phone}` });
    } catch (err) {
      console.error('Error sending message:', err.message);
      return sendJson(res, 500, { error: err.message });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`🟢 Local WhatsApp Development Daemon running on port ${PORT}`);
  console.log(`   Health:     http://localhost:${PORT}/health`);
  console.log(`   Status:     http://localhost:${PORT}/status`);
  console.log(`   Scan QR:    http://localhost:${PORT}/qr`);
  console.log(`   Connect:    POST http://localhost:${PORT}/connect`);
  console.log(`   Disconnect: POST http://localhost:${PORT}/disconnect`);
  console.log(`   Send:       POST http://localhost:${PORT}/send`);
  console.log(`   Environment: Local Only (Safe from Vercel)`);
  console.log(`========================================================`);
  console.log(`⏸️  Daemon is ready and waiting.`);
  console.log(`👉 Click "Connect" on the Dashboard (http://localhost:3000/dashboard) to generate QR code.\n`);
});

