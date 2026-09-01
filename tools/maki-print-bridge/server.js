/**
 * MAKI DESU POS — Standalone Production Thermal Print Bridge Agent
 * 
 * Runs on the local POS terminal computer (Windows / Linux / Mac).
 * Listens on http://127.0.0.1:18181 to receive raw ESC/POS & thermal receipts 
 * and silently spool them to the physical receipt printer.
 */

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 18181;
const HOST = '127.0.0.1';
const TEMP_DIR = path.join(os.tmpdir(), 'makidesu_print_bridge');

if (!fs.existsSync(TEMP_DIR)) {
  try {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create temp dir:', e);
  }
}

// Allowed Origins for CORS
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

/**
 * Get installed Windows printers using PowerShell
 */
function getWindowsPrinters() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      return resolve([{ name: 'Default Printer', isDefault: true }]);
    }

    const cmd = `powershell -NoProfile -Command "Get-CimInstance Win32_Printer | Select-Object Name, Default, PortName | ConvertTo-Json -Compress"`;
    exec(cmd, { timeout: 5000 }, (err, stdout) => {
      if (err || !stdout.trim()) {
        return resolve([]);
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const formatted = list.map(p => ({
          name: p.Name,
          isDefault: !!p.Default,
          port: p.PortName
        }));
        resolve(formatted);
      } catch {
        resolve([]);
      }
    });
  });
}

/**
 * Print raw binary or text to a printer on Windows using native Win32 RAW Spooler
 */
async function printJobOnWindows(buffer, printerName) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(TEMP_DIR, `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.bin`);
    fs.writeFileSync(tmpFile, buffer);

    const scriptPath = path.join(__dirname, 'print-raw.ps1');
    const targetPrinter = printerName || '';

    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -PrinterName "${targetPrinter}" -FilePath "${tmpFile}"`;

    exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
      // Clean up temp file safely
      try { fs.unlinkSync(tmpFile); } catch {}

      if (err) {
        return reject(new Error(`Print spooling failed: ${stderr || stdout || err.message}`));
      }
      resolve(true);
    });
  });
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

  // 1. Health Check
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'MAKI DESU POS Print Bridge',
      version: '1.0.0',
      platform: process.platform,
      hostname: os.hostname(),
      uptime_seconds: Math.floor(process.uptime()),
    }));
    return;
  }

  // 2. Available Printers List
  if (req.method === 'GET' && url.pathname === '/printers') {
    const printers = await getWindowsPrinters();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      printers,
    }));
    return;
  }

  // 3. Print Spool Request
  if (req.method === 'POST' && url.pathname === '/print') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { raw_escpos_base64, formatted_text, printer_name, job_uuid, order_number } = payload;

        if (!raw_escpos_base64 && !formatted_text) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Missing raw_escpos_base64 or formatted_text payload' }));
          return;
        }

        let buffer;
        if (raw_escpos_base64) {
          buffer = Buffer.from(raw_escpos_base64, 'base64');
        } else {
          buffer = Buffer.from(formatted_text, 'utf8');
        }

        console.log(`[PRINT BRIDGE] Spooling Order #${order_number || job_uuid || 'N/A'} to printer "${printer_name || 'Default'}" (${buffer.length} bytes)...`);

        if (process.platform === 'win32') {
          await printJobOnWindows(buffer, printer_name);
        } else {
          // Linux / macOS lp spooler
          await new Promise((resolve, reject) => {
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

        console.log(`[PRINT BRIDGE] ✓ Print successfully sent to printer spooler for Order #${order_number || job_uuid}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Spooling completed successfully',
          job_uuid,
          order_number,
        }));
      } catch (err) {
        console.error('[PRINT BRIDGE] Spooling error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Printer spooling error: ' + err.message,
        }));
      }
    });
    return;
  }

  // 404 Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(`  MAKI DESU POS Thermal Print Bridge Agent running`);
  console.log(`  Listening on http://${HOST}:${PORT}`);
  console.log(`  Ready to receive silent ESC/POS thermal print jobs`);
  console.log('====================================================');
});
