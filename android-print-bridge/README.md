# 🍙 MAKI DESU POS — Native Android Thermal Print Bridge Companion

## Overview

The **MAKI DESU Android Thermal Print Bridge** is a lightweight, dedicated Android background companion service designed to connect directly to standard **58mm Bluetooth Thermal Receipt Printers** (such as POS-58, XP-58, PT-210, MPT-II, Goojprt, Zjiang, Milestone, and Netum) and print receipts created on the MAKI DESU Web POS.

---

## Why Android Native SPP Printing Works (Loyverse Compatibility)

Standard 58mm portable Bluetooth thermal receipt printers communicate via the **Bluetooth Serial Port Profile (RFCOMM SPP)** with UUID `00001101-0000-1000-8000-00805F9B34FB`.

* **Windows Limitation**: Windows desktop often requires custom manufacturer printer drivers or manual virtual COM port setup, frequently showing driver/connection errors for generic Bluetooth thermal printers.
* **Android Native Advantage**: Android apps (such as Loyverse POS) open direct RFCOMM sockets (`device.createRfcommSocketToServiceRecord(SPP_UUID)`) directly to the paired printer without requiring proprietary OS printer drivers.

This application uses the exact same RFCOMM SPP communication architecture as Loyverse, guaranteeing 100% hardware compatibility with any paired Bluetooth thermal printer.

---

## How It Works in Production

```text
Cashier Tablet / Laptop / Phone
         │
         ▼
MAKI DESU Web POS (Browser)
         │  (Completes sale & inventory deduction)
         ▼
Laravel Central Print Job Queue (makidesuoperation.site)
         │  (Generates 58mm ESC/POS payload)
         ▼
MAKI DESU Android Print Bridge (Background Foreground Service)
         │  (Atomically claims job via REST API)
         ▼
Bluetooth RFCOMM SPP Socket
         │  (Streams 58mm ESC/POS bytes)
         ▼
Physical 58mm Thermal Receipt Printer
```

---

## Setup & Installation Guide

### Step 1: Pair the Printer in Android
1. Power on your 58mm Bluetooth thermal printer.
2. Open **Settings → Bluetooth** on your Android device.
3. Tap on your printer (e.g. `MTP-II`, `POS-58`, `Bluetooth Printer`, `PT-210`).
4. Enter the PIN when prompted (typically `0000` or `1234`).
5. Ensure the printer appears under **Paired Devices**.

### Step 2: Configure the Bridge App
1. Open the **MAKI DESU Print Bridge** app on your Android device.
2. Grant Bluetooth and Notification permissions when prompted.
3. Verify the **Server API URL** (defaults to `https://makidesuoperation.site`).
4. Select your **Branch** (`Victoria` or `Sta. Cruz`) and **Terminal ID** (`POS-01`).
5. In the **Paired Bluetooth Printer** dropdown, select your paired printer.
6. Tap **TEST PRINT (58mm)** to verify hardware printing.

### Step 3: Start the Service
1. Tap **START SERVICE**.
2. A persistent notification will appear: `MAKI DESU Print Bridge is active and listening for POS print jobs`.
3. Now, whenever any cashier checks out a sale on the Web POS for that branch, the receipt will automatically print on the Bluetooth thermal printer within 1–2 seconds!

---

## Building the APK

### Requirements
* Android Studio Iguana / Hedgehog or Gradle 8.3+
* Android SDK 34 (Android 7.0+ supported, API 24 to 34)
* Java 17

### Build Command
```bash
cd android-print-bridge
./gradlew assembleRelease
# Output APK: app/build/outputs/apk/release/app-release.apk
```
Or simply open the `android-print-bridge` directory in Android Studio and click **Run** or **Build APK**.
