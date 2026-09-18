# 🍙 MAKI DESU POS — Production Thermal Print Bridge v2.0

A lightweight, secure, and production-ready local print service for the **MAKI DESU Web POS**.

---

## 🎯 Purpose

Web browsers cannot directly send raw binary ESC/POS byte streams to local physical thermal printers without showing a browser print dialog. 

This local print bridge acts as the hardware intermediary on the cashier's computer:
1. It runs locally at `http://127.0.0.1:18181`.
2. When the cashier completes an order, the MAKI DESU Web POS automatically spools the raw ESC/POS payload to `http://127.0.0.1:18181/print`.
3. The bridge queues and spools the receipt directly to the configured Windows Thermal Printer (USB, LAN/Network IP, or Serial) with **zero user prompts**, clean 58mm alignment, and automatic paper cutting.

---

## 🚀 Quick Setup on Cashier Computer

### System Requirements
* Windows 10 / 11 (or Linux/macOS).
* Node.js v18+ installed on the cashier terminal.
* A standard thermal receipt printer (58mm or 80mm ESC/POS compatible, e.g. Epson, Xprinter, Rongta, POS-58, XP-58C, POS-80) connected via USB or Local Network.

### Option A: Automatic Startup (Recommended for Stores)
1. Double-click `install-startup.bat`.
2. The print bridge will start immediately and automatically run in the background every time the computer boots up.

### Option B: Manual Start (Interactive Console)
1. Double-click `start-print-bridge.bat` or run:
   ```bash
   node server.js
   ```
2. The bridge will listen on `http://127.0.0.1:18181`.

---

## ⚙️ Printer Configuration in POS

1. Open the MAKI DESU POS in your browser (`/pos`).
2. Look at the top-right header:
   - `🟢 Printer Ready` (Bridge is connected and ready).
   - `🟡 Printer Offline` (Click to check connection, configure printer, or run a test print).
3. Click the printer indicator to open the **Thermal Printer Settings & Diagnostics** modal.
4. Select your installed thermal printer from the dropdown and click **Test Printer** to print a sample 58mm test receipt.

---

## 📡 API Endpoints (Localhost Only)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Returns service health, uptime, and queue state |
| `GET` | `/printers` | Lists all installed Windows printers and default port |
| `POST` | `/test-print` | Spools a formatted 58mm diagnostic test receipt |
| `POST` | `/print` | Spools a real POS sale receipt via sequential FIFO queue |

---

## 🛡️ Security & Reliability Features
- **Localhost Binding**: Binds strictly to `127.0.0.1` and is never exposed to the public internet.
- **Strict CORS**: Only accepts requests from the authorized POS web application.
- **Sequential Queue**: Processes rapid back-to-back orders in strict FIFO order to prevent stream corruption.
- **Deduplication**: Sliding window cache prevents double-printing from double-clicks or browser retries.
- **Safe Fallback**: If the bridge is ever stopped, the POS automatically offers browser-based 58mm printing without losing sales or inventory records.
