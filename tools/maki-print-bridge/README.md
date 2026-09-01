# MAKI DESU POS — Standalone Thermal Print Bridge Agent

A lightweight, secure, and production-ready local print service for the **MAKI DESU Web POS**.

## Purpose

Web browsers cannot directly send raw binary ESC/POS byte streams to local physical thermal printers without showing a browser print dialog. 

This print bridge acts as the local hardware intermediary:
1. It runs locally on the POS terminal machine at `http://127.0.0.1:18181`.
2. When the cashier completes an order, the MAKI DESU Web POS automatically sends the raw ESC/POS payload to `http://127.0.0.1:18181/print`.
3. The bridge spools the receipt directly to the configured Windows Thermal Printer (USB, Serial, Ethernet, or Spooler) with zero user prompts and paper auto-cut.

---

## Installation & Running on POS Terminal

### Requirements
* Node.js v16+ installed on the POS computer.
* A standard thermal receipt printer (58mm or 80mm ESC/POS compatible, e.g., Epson, Xprinter, Rongta, POS-58, POS-80) installed in Windows.

### Quick Start
1. Double-click `start-print-bridge.bat` or run:
   ```bash
   node server.js
   ```
2. The bridge will start on `http://127.0.0.1:18181`.
3. Open the MAKI DESU POS in your browser — the header will show:
   `🟢 Thermal Printer Ready`

---

## Endpoints

* `GET /health`: Returns service health and uptime.
* `GET /printers`: Lists all installed Windows printers.
* `POST /print`: Spools receipt to thermal printer.
  * Body:
    ```json
    {
      "job_uuid": "...",
      "order_number": "POS-0012",
      "printer_name": "POS-80",
      "raw_escpos_base64": "..."
    }
    ```
