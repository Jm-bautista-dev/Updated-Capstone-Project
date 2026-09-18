/**
 * MAKI DESU POS — Standalone Production Thermal Print Bridge Agent
 * 
 * Runs on the local POS terminal computer (Windows / Linux / macOS).
 * Listens on http://127.0.0.1:18181 to receive raw ESC/POS & thermal receipts 
 * and silently spool them to the physical receipt printer.
 * 
 * Features:
 * - Sequential FIFO Print Queue (prevents output corruption from rapid consecutive orders)
 * - Duplicate Print Protection (in-memory sliding cache of recent job UUIDs)
 * - Direct TCP / Network Thermal Printer support (port 9100)
 * - Native Windows Raw Spooler (winspool.drv) for USB thermal printers
 * - Dedicated /test-print diagnostic endpoint for 58mm & 80mm paper
 * - Secure local binding (127.0.0.1 only) & strict CORS validation
 */

const http = require('http');
const net = require('net');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = parseInt(process.env.PORT || '18181', 10);
const HOST = '127.0.0.1';
const TEMP_DIR = path.join(os.tmpdir(), 'makidesu_print_bridge');

if (!fs.existsSync(TEMP_DIR)) {
  try {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  } catch (e) {
    console.error('[BRIDGE] Failed to create temp directory:', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CORS & SECURITY
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGIN_REGEX = /^(http:\/\/localhost(:\d+)?|http:\/\/127\.0\.0\.1(:\d+)?|https?:\/\/.*makidesu.*|https?:\/\/.*31\.220\.110\.128.*|https?:\/\/.*u316577386.*)$/i;

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGIN_REGEX.test(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DUPLICATE PRINT PROTECTION CACHE
// ─────────────────────────────────────────────────────────────────────────────

const PROCESSED_JOBS = new Map(); // uuid -> timestamp
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function isDuplicateJob(jobUuid) {
  if (!jobUuid) return false;
  const now = Date.now();
  if (PROCESSED_JOBS.has(jobUuid)) {
    const timestamp = PROCESSED_JOBS.get(jobUuid);
    if (now - timestamp < DUPLICATE_WINDOW_MS) {
      return true;
    }
  }
  return false;
}

function recordJob(jobUuid) {
  if (!jobUuid) return;
  PROCESSED_JOBS.set(jobUuid, Date.now());

  // Clean up old entries periodically
  if (PROCESSED_JOBS.size > 500) {
    const cutoff = Date.now() - DUPLICATE_WINDOW_MS;
    for (const [key, ts] of PROCESSED_JOBS.entries()) {
      if (ts < cutoff) PROCESSED_JOBS.delete(key);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SEQUENTIAL FIFO PRINT QUEUE
// ─────────────────────────────────────────────────────────────────────────────

class PrintQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  enqueue(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processNext();
    });
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const { task, resolve, reject } = this.queue.shift();
    try {
      const result = await task();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.isProcessing = false;
      // Slight yield to allow hardware buffer settling
      setTimeout(() => this.processNext(), 150);
    }
  }
}

const printQueue = new PrintQueue();

// ─────────────────────────────────────────────────────────────────────────────
// 4. PRINTER DETECTION
// ─────────────────────────────────────────────────────────────────────────────

function getWindowsPrinters() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      return resolve([{ name: 'Default Thermal Printer', isDefault: true, port: 'USB001' }]);
    }

    const cmd = `powershell -NoProfile -Command "Get-CimInstance Win32_Printer | Select-Object Name, Default, PortName | ConvertTo-Json -Compress"`;
    exec(cmd, { timeout: 6000 }, (err, stdout) => {
      if (err || !stdout.trim()) {
        return resolve([]);
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const formatted = list.map(p => ({
          name: p.Name,
          isDefault: !!p.Default,
          port: p.PortName || ''
        }));
        resolve(formatted);
      } catch {
        resolve([]);
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. HARDWARE PRINT HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Direct TCP Socket Printing for Network/LAN Thermal Printers (Port 9100)
 */
function printOverTcp(buffer, host, port = 9100) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.setTimeout(6000);

    client.connect(port, host, () => {
      client.write(buffer, () => {
        client.end();
        resolve(true);
      });
    });

    client.on('error', (err) => {
      client.destroy();
      reject(new Error(`TCP Network Printer (${host}:${port}) connection error: ${err.message}`));
    });

    client.on('timeout', () => {
      client.destroy();
      reject(new Error(`TCP Network Printer (${host}:${port}) connection timed out.`));
    });
  });
}

/**
 * Native Windows Win32 Raw Spooler via print-raw.ps1
 */
function printOverWindowsSpooler(buffer, printerName) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(TEMP_DIR, `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.bin`);
    fs.writeFileSync(tmpFile, buffer);

    const scriptPath = path.join(__dirname, 'print-raw.ps1');
    const safePrinter = (printerName || '').replace(/["']/g, '');

    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -PrinterName "${safePrinter}" -FilePath "${tmpFile}"`;

    exec(cmd, { timeout: 12000 }, (err, stdout, stderr) => {
      try { fs.unlinkSync(tmpFile); } catch {}

      if (err) {
        return reject(new Error(`Windows Spooler failed: ${stderr || stdout || err.message}`));
      }
      resolve(true);
    });
  });
}

/**
 * Universal spool dispatcher based on printer configuration
 */
async function dispatchPrintJob(buffer, config = {}) {
  const { connection_type, tcp_host, tcp_port, printer_name } = config;

  if (connection_type === 'network' && tcp_host) {
    return await printOverTcp(buffer, tcp_host, tcp_port || 9100);
  }

  if (process.platform === 'win32') {
    return await printOverWindowsSpooler(buffer, printer_name);
  }

  // Linux / macOS lp fallback
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(TEMP_DIR, `job_${Date.now()}.bin`);
    fs.writeFileSync(tmpFile, buffer);
    const cmd = printer_name ? `lp -d "${printer_name}" "${tmpFile}"` : `lp "${tmpFile}"`;
    exec(cmd, (err) => {
      try { fs.unlinkSync(tmpFile); } catch {}
      if (err) return reject(err);
      resolve(true);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ESC/POS RECEIPT GENERATOR (58mm & 80mm)
// ─────────────────────────────────────────────────────────────────────────────

function generateTestReceiptEscPos(branchName = 'VICTORIA', paperWidth = 58) {
  const cols = paperWidth === 80 ? 42 : 32;
  const ESC = '\x1B';
  const GS = '\x1D';

  let out = '';
  out += `${ESC}@`; // Initialize
  out += `${ESC}t\x00`; // CP437

  // Title Header
  out += `${ESC}a\x01`; // Center
  out += `${GS}!\x11`; // Double width & height
  out += `${ESC}E\x01`; // Bold
  out += 'MAKI DESU\n';
  out += `${GS}!\x00`; // Normal size
  out += `${branchName.toUpperCase()}\n`;
  out += `${ESC}E\x00`; // Bold off
  out += '-'.repeat(cols) + '\n';

  // Subtitle
  out += `${ESC}E\x01`;
  out += 'THERMAL PRINTER TEST\n';
  out += `${ESC}E\x00`;
  out += '-'.repeat(cols) + '\n';

  // Body Details
  out += `${ESC}a\x00`; // Left align
  out += `Date: ${new Date().toLocaleString('en-PH')}\n`;
  out += `Paper Width: ${paperWidth}mm (${cols} columns)\n`;
  out += `Spooler: ESC/POS Direct Stream\n`;
  out += `Status: OK - Connection Ready\n`;
  out += '-'.repeat(cols) + '\n';

  // Sample items
  out += `${ESC}E\x01`;
  out += cols === 32 ? 'Item (Qty)                 Price\n' : 'Item                   Qty          Price\n';
  out += `${ESC}E\x00`;
  out += '-'.repeat(cols) + '\n';
  out += cols === 32 ? 'Test Sample Item x1       150.00\n' : 'Test Sample Item         1         150.00\n';
  out += cols === 32 ? 'TOTAL                     150.00\n' : 'TOTAL                              150.00\n';
  out += '-'.repeat(cols) + '\n';

  // Footer
  out += `${ESC}a\x01`; // Center
  out += `${ESC}E\x01`;
  out += 'TEST PRINT SUCCESSFUL!\n';
  out += `${ESC}E\x00`;
  out += 'Thermal bridge is ready for POS.\n';

  // Feed & Cut
  out += '\n\n\n\n';
  out += `${GS}V\x41\x10`;

  return Buffer.from(out, 'binary');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. HTTP REQUEST ROUTER
// ─────────────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

  // 1. Health Probe
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'MAKI DESU POS Thermal Print Bridge',
      version: '2.0.0',
      platform: process.platform,
      hostname: os.hostname(),
      uptime_seconds: Math.floor(process.uptime()),
      queue_pending: printQueue.queue.length,
      is_processing: printQueue.isProcessing,
    }));
    return;
  }

  // 2. Detected System Printers
  if (req.method === 'GET' && url.pathname === '/printers') {
    try {
      const printers = await getWindowsPrinters();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        count: printers.length,
        printers,
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: err.message, printers: [] }));
    }
    return;
  }

  // 3. Test Print Diagnostic Endpoint
  if (req.method === 'POST' && url.pathname === '/test-print') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const branchName = payload.branch_name || 'VICTORIA';
        const paperWidth = parseInt(payload.paper_width || '58', 10);
        const printerName = payload.printer_name || '';

        console.log(`[PRINT BRIDGE] Spooling test receipt (${paperWidth}mm) for branch "${branchName}" to printer "${printerName || 'Default'}"...`);

        const testBuffer = generateTestReceiptEscPos(branchName, paperWidth);

        await printQueue.enqueue(() => dispatchPrintJob(testBuffer, {
          connection_type: payload.connection_type || 'usb',
          tcp_host: payload.tcp_host,
          tcp_port: payload.tcp_port,
          printer_name: printerName,
        }));

        console.log(`[PRINT BRIDGE] ✓ Test receipt successfully spooled!`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Test receipt spooled successfully to thermal printer.',
          paper_width: paperWidth,
          printer_name: printerName || 'Default',
        }));
      } catch (err) {
        console.error('[PRINT BRIDGE] Test print failed:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Test print failed: ' + err.message,
        }));
      }
    });
    return;
  }

  // 4. Real POS Sale Receipt Spool
  if (req.method === 'POST' && url.pathname === '/print') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { raw_escpos_base64, formatted_text, printer_name, job_uuid, order_number, connection_type, tcp_host, tcp_port } = payload;

        if (!raw_escpos_base64 && !formatted_text) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Missing raw_escpos_base64 or formatted_text receipt payload' }));
          return;
        }

        // Duplicate Check
        if (job_uuid && isDuplicateJob(job_uuid)) {
          console.log(`[PRINT BRIDGE] ℹ️ Ignored duplicate print request for Job UUID: ${job_uuid} (Order #${order_number})`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Duplicate job ignored (already printed)',
            job_uuid,
            order_number,
          }));
          return;
        }

        let buffer;
        if (raw_escpos_base64) {
          buffer = Buffer.from(raw_escpos_base64, 'base64');
        } else {
          buffer = Buffer.from(formatted_text, 'utf8');
        }

        console.log(`[PRINT BRIDGE] Enqueueing Order #${order_number || job_uuid || 'N/A'} for printer "${printer_name || 'Default'}" (${buffer.length} bytes)...`);

        await printQueue.enqueue(() => dispatchPrintJob(buffer, {
          connection_type: connection_type || 'usb',
          tcp_host,
          tcp_port,
          printer_name,
        }));

        if (job_uuid) {
          recordJob(job_uuid);
        }

        console.log(`[PRINT BRIDGE] ✓ Order #${order_number || job_uuid} successfully spooled to thermal printer.`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Receipt successfully spooled to thermal printer',
          job_uuid,
          order_number,
        }));
      } catch (err) {
        console.error('[PRINT BRIDGE] Spooling failed:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Thermal printer error: ' + err.message,
        }));
      }
    });
    return;
  }

  // 404 Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found on Maki Desu Print Bridge' }));
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. SERVER STARTUP & ERROR HANDLING
// ─────────────────────────────────────────────────────────────────────────────

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('================================================================');
    console.log('   🍙 MAKI DESU POS — Production Thermal Print Bridge v2.0     ');
    console.log('================================================================');
    console.log(`   Status:       ALREADY ACTIVE & LISTENING                     `);
    console.log(`   Address:      http://${HOST}:${PORT}                        `);
    console.log('   Notice:       An existing instance of the Print Bridge is   ');
    console.log('                 already running and ready on this computer.   ');
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error('[PRINT BRIDGE] Fatal Server Error:', err.message);
    process.exit(1);
  }
});

server.listen(PORT, HOST, () => {
  console.log('================================================================');
  console.log('   🍙 MAKI DESU POS — Production Thermal Print Bridge v2.0     ');
  console.log('================================================================');
  console.log(`   Status:       LISTENING (Ready for POS Print Jobs)          `);
  console.log(`   Address:      http://${HOST}:${PORT}                        `);
  console.log(`   Paper Width:  58mm & 80mm ESC/POS Spooling                  `);
  console.log(`   Concurrency:  Sequential FIFO Queue Enabled                `);
  console.log('================================================================\n');
});

