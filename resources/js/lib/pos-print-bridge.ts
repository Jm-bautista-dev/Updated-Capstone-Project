import axios from 'axios';
import { useEffect, useState, useCallback, useRef } from 'react';
import { buildReceiptEscPos, buildTestReceiptEscPos } from './escpos-builder';

export const LOCAL_BRIDGE_URL = 'http://127.0.0.1:18181';
export const STORAGE_KEY_PRINTER_CONFIG = 'makidesu_pos_printer_config';
export const STORAGE_KEY_SAVED_DIRECT_DEVICE = 'makidesu_saved_direct_usb_device';

export type PrinterConnectionType = 'direct_bluetooth' | 'direct_usb' | 'usb' | 'android_bridge' | 'network' | 'serial';

export interface PrinterConfig {
    printer_name: string;
    connection_type: PrinterConnectionType;
    tcp_host: string;
    tcp_port: number;
    com_port: string;
    baud_rate: number;
    paper_width: 58 | 80;
    auto_print: boolean;
    cut_paper: boolean;
    encoding: string;
    selected_bridge_uuid?: string;
    direct_device_vendor_id?: number;
    direct_device_product_id?: number;
    direct_device_serial?: string;
    bluetooth_device_id?: string;
}

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
    printer_name: '',
    connection_type: 'direct_bluetooth',
    tcp_host: '192.168.1.100',
    tcp_port: 9100,
    com_port: 'COM1',
    baud_rate: 9600,
    paper_width: 58,
    auto_print: true,
    cut_paper: true,
    encoding: 'CP437',
    selected_bridge_uuid: '',
};

export interface RegisteredBridge {
    id: number;
    bridge_uuid: string;
    name: string;
    branch_id: number;
    terminal_id?: string;
    device_type: 'android' | 'windows' | 'network';
    paired_printer_name?: string;
    paired_printer_address?: string;
    connection_type: string;
    status: string;
    is_online: boolean;
    battery_level?: number;
    last_heartbeat_at?: string;
}

export interface DetectedPrinter {
    id?: string;
    name: string;
    isDefault: boolean;
    port: string;
    type: 'webbluetooth' | 'webusb' | 'webserial' | 'windows_spooler' | 'network' | 'android';
    vendorId?: number;
    productId?: number;
    rawDevice?: unknown;
}

export interface ReceiptItemPayload {
    name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    addons?: Array<{ name: string; price: number }>;
}

export interface ReceiptDataPayload {
    branch_id?: number;
    branch_name?: string;
    branch_address?: string;
    order_number?: string;
    date_time?: string;
    fulfillment_type?: string;
    cashier_name?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_address?: string;
    items?: ReceiptItemPayload[];
    subtotal?: number;
    discount?: number;
    discount_type?: string;
    delivery_fee?: number;
    total?: number;
    payment_method?: string;
    paid_amount?: number;
    change_amount?: number;
    paper_width?: number;
    is_reprint?: boolean;
    reprint_reason?: string;
    reprinted_at?: string;
}

export interface LocalPrintJobPayload {
    id?: number;
    job_uuid: string;
    order_number: string;
    printer_name?: string;
    connection_type?: PrinterConnectionType;
    tcp_host?: string;
    tcp_port?: number;
    paper_width?: number;
    raw_escpos_base64?: string;
    formatted_text?: string;
    receipt_data?: ReceiptDataPayload;
}

export type PrinterBridgeStatus = 'ready' | 'offline' | 'checking' | 'scanning' | 'permission_required' | 'disconnected';

// ── WebUSB, WebSerial & WebBluetooth Interfaces ──
export interface WebUSBEndpoint {
    endpointNumber: number;
    direction: 'in' | 'out';
    type: 'bulk' | 'interrupt' | 'isochronous';
}

export interface WebUSBAlternateInterface {
    alternateSetting: number;
    interfaceClass: number;
    endpoints: WebUSBEndpoint[];
}

export interface WebUSBInterface {
    interfaceNumber: number;
    alternate?: WebUSBAlternateInterface;
    alternates?: WebUSBAlternateInterface[];
}

export interface WebUSBConfiguration {
    configurationValue: number;
    interfaces: WebUSBInterface[];
}

export interface WebUSBDevice {
    vendorId: number;
    productId: number;
    productName?: string;
    serialNumber?: string;
    opened: boolean;
    configuration: WebUSBConfiguration | null;
    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(configurationValue: number): Promise<void>;
    claimInterface(interfaceNumber: number): Promise<void>;
    transferOut(endpointNumber: number, data: Uint8Array | ArrayBuffer | ArrayBufferView | BufferSource): Promise<{ status: 'ok' | 'stall' | 'babble'; bytesWritten: number }>;
}

export interface WebSerialPort {
    readable: unknown;
    writable: {
        getWriter(): {
            write(chunk: Uint8Array): Promise<void>;
            releaseLock(): void;
        };
    } | null;
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    getInfo?(): { usbVendorId?: number; usbProductId?: number };
}

export interface WebBluetoothCharacteristic {
    properties?: {
        write?: boolean;
        writeWithoutResponse?: boolean;
        notify?: boolean;
        read?: boolean;
    };
    writeValue(value: BufferSource | Uint8Array | ArrayBuffer | ArrayBufferView): Promise<void>;
    writeValueWithResponse?(value: BufferSource | Uint8Array | ArrayBuffer | ArrayBufferView): Promise<void>;
    writeValueWithoutResponse?(value: BufferSource | Uint8Array | ArrayBuffer | ArrayBufferView): Promise<void>;
}

export interface WebBluetoothService {
    getCharacteristic(characteristic: string): Promise<WebBluetoothCharacteristic>;
    getCharacteristics?(): Promise<WebBluetoothCharacteristic[]>;
}

export interface WebBluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<WebBluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<WebBluetoothService>;
    getPrimaryServices?(): Promise<WebBluetoothService[]>;
}

export interface WebBluetoothDevice {
    id: string;
    name?: string;
    gatt?: WebBluetoothRemoteGATTServer;
}

// ── Singleton Hardware Handles ──
let activeUsbDevice: WebUSBDevice | null = null;
let activeUsbEndpoint: number | null = null;
let activeSerialPort: WebSerialPort | null = null;
let activeBluetoothDevice: WebBluetoothDevice | null = null;
let activeBluetoothCharacteristic: WebBluetoothCharacteristic | null = null;

// ── 1. BROWSER CAPABILITY CHECKS ──
export function isWebUsbSupported(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
}

export function isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
}

export function isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Retrieve saved printer configuration from terminal's localStorage
 */
export function getPrinterConfig(): PrinterConfig {
    if (typeof window === 'undefined') {
        return DEFAULT_PRINTER_CONFIG;
    }
    try {
        const stored = localStorage.getItem(STORAGE_KEY_PRINTER_CONFIG);
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                ...DEFAULT_PRINTER_CONFIG,
                ...parsed,
                paper_width: parsed.paper_width === 80 ? 80 : 58,
                auto_print: typeof parsed.auto_print === 'boolean' ? parsed.auto_print : true,
            };
        }
    } catch {
        // Fallback on corrupt JSON
    }
    return DEFAULT_PRINTER_CONFIG;
}

/**
 * Save updated printer configuration to terminal's localStorage
 */
export function savePrinterConfig(updates: Partial<PrinterConfig>): PrinterConfig {
    if (typeof window === 'undefined') {
        return DEFAULT_PRINTER_CONFIG;
    }
    const current = getPrinterConfig();
    const merged: PrinterConfig = {
        ...current,
        ...updates,
    };
    try {
        localStorage.setItem(STORAGE_KEY_PRINTER_CONFIG, JSON.stringify(merged));
    } catch {
        // Storage quota exceeded fallback
    }
    return merged;
}

// ── 2. DIRECT BLUETOOTH & DIRECT HARDWARE ADAPTERS ──

/**
 * Known Thermal Printer BLE GATT Service UUIDs
 */
const KNOWN_BLE_PRINTER_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS Service
    '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC2541 POS Printers (most common 58mm BLE)
    '0000ffe1-0000-1000-8000-00805f9b34fb', 
    '0000ff00-0000-1000-8000-00805f9b34fb', // ISSC Transparent Serial
    '0000ff02-0000-1000-8000-00805f9b34fb',
    '0000ff03-0000-1000-8000-00805f9b34fb',
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Dual Mode
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // PosBank / Generic BLE Printer
    '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent / Chinese POS BLE
    '0000ae00-0000-1000-8000-00805f9b34fb', // Xprinter BLE
    '0000ae01-0000-1000-8000-00805f9b34fb',
    '0000af30-0000-1000-8000-00805f9b34fb', // MPT-II / Goojprt BLE
    '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
    '0000180a-0000-1000-8000-00805f9b34fb', // Device Info
];

/**
 * Scan & Connect to Direct BLE Thermal Printer via Web Bluetooth
 */
export async function scanAndRequestWebBluetoothPrinter(): Promise<{
    success: boolean;
    printer?: DetectedPrinter;
    message?: string;
}> {
    if (!isWebBluetoothSupported()) {
        return {
            success: false,
            message: 'Web Bluetooth is not supported in this browser. Please use Chrome/Edge on HTTPS or the Local Print Bridge.',
        };
    }

    try {
        const bt = (navigator as unknown as { bluetooth: { requestDevice(options: { acceptAllDevices?: boolean; optionalServices?: string[] }): Promise<WebBluetoothDevice> } }).bluetooth;

        const device = await bt.requestDevice({
            acceptAllDevices: true,
            optionalServices: KNOWN_BLE_PRINTER_SERVICES,
        });

        if (!device) {
            return { success: false, message: 'No Bluetooth printer selected.' };
        }

        const printerName = device.name || 'Bluetooth Thermal Printer';

        // Connect GATT Server
        if (device.gatt) {
            if (device.gatt.connected) {
                try {
                    device.gatt.disconnect();
                } catch {
                    void 0;
                }
            }

            const server = await device.gatt.connect();
            let matchedCharacteristic: WebBluetoothCharacteristic | null = null;

            // Probe available primary services first
            if (server.getPrimaryServices) {
                try {
                    const services = await server.getPrimaryServices();
                    for (const s of services) {
                        try {
                            if (s.getCharacteristics) {
                                const chars = await s.getCharacteristics();
                                const writeChar = chars.find((c: WebBluetoothCharacteristic) => c.properties?.write || c.properties?.writeWithoutResponse);
                                if (writeChar) {
                                    matchedCharacteristic = writeChar;
                                    break;
                                }
                            }
                        } catch {
                            void 0;
                        }
                    }
                } catch {
                    void 0;
                }
            }

            // Fallback: probe known service UUIDs
            if (!matchedCharacteristic) {
                for (const serviceUuid of KNOWN_BLE_PRINTER_SERVICES) {
                    try {
                        const service = await server.getPrimaryService(serviceUuid);
                        if (service && service.getCharacteristics) {
                            const chars = await service.getCharacteristics();
                            const writeChar = chars.find((c: WebBluetoothCharacteristic) => c.properties?.write || c.properties?.writeWithoutResponse);
                            if (writeChar) {
                                matchedCharacteristic = writeChar;
                                break;
                            }
                        }
                    } catch {
                        void 0;
                    }
                }
            }

            activeBluetoothDevice = device;
            activeBluetoothCharacteristic = matchedCharacteristic;
        }

        savePrinterConfig({
            connection_type: 'direct_bluetooth',
            printer_name: printerName,
            bluetooth_device_id: device.id,
        });

        return {
            success: true,
            printer: {
                id: `ble_${device.id}`,
                name: printerName,
                isDefault: true,
                port: 'Direct Web Bluetooth (BLE)',
                type: 'webbluetooth',
                rawDevice: device,
            },
        };
    } catch (err: unknown) {
        const errorObj = err as { name?: string; message?: string };
        if (errorObj.name === 'NotFoundError') {
            return { success: false, message: 'Bluetooth device selection was cancelled.' };
        }
        if (errorObj.name === 'SecurityError') {
            return { success: false, message: 'Bluetooth access was denied. Please allow device access.' };
        }
        return {
            success: false,
            message: `Could not connect to Bluetooth printer: ${errorObj.message || 'Device unreachable'}.`,
        };
    }
}

/**
 * Scan & Request Direct Bluetooth Classic SPP via Web Serial (POS58D / COM Links)
 */
export async function scanAndRequestBluetoothSppPrinter(baudRate = 9600): Promise<{
    success: boolean;
    printer?: DetectedPrinter;
    message?: string;
}> {
    if (!isWebSerialSupported()) {
        return {
            success: false,
            message: 'Web Serial is not supported in this browser. Please use Chrome or Edge.',
        };
    }

    try {
        const serial = (navigator as unknown as { serial: { requestPort(): Promise<WebSerialPort> } }).serial;
        const port = await serial.requestPort();

        if (!port) {
            return { success: false, message: 'No serial port selected.' };
        }

        // Clean up any previously opened port to avoid COM lock conflicts
        if (activeSerialPort && activeSerialPort !== port) {
            try {
                await activeSerialPort.close?.();
            } catch {
                void 0;
            }
            activeSerialPort = null;
        }

        const info = port.getInfo ? port.getInfo() : {};
        const printerName = 'POS58D Bluetooth Printer';

        // Check if port is already open
        let isAlreadyOpen = false;
        try {
            if (port.readable || port.writable) {
                isAlreadyOpen = true;
            }
        } catch {
            void 0;
        }

        if (!isAlreadyOpen) {
            try {
                await port.open({ baudRate });
            } catch (openErr: unknown) {
                const errName = (openErr as { name?: string; message?: string })?.name;
                if (errName !== 'InvalidStateError' && !String(openErr).includes('already open')) {
                    throw openErr;
                }
            }
        }

        activeSerialPort = port;

        savePrinterConfig({
            connection_type: 'direct_bluetooth',
            printer_name: printerName,
            baud_rate: baudRate,
            direct_device_vendor_id: info.usbVendorId,
            direct_device_product_id: info.usbProductId,
        });

        return {
            success: true,
            printer: {
                id: `spp_${info.usbVendorId || 'bt'}_${Date.now()}`,
                name: printerName,
                isDefault: true,
                port: `Bluetooth SPP Link (${baudRate} baud)`,
                type: 'webserial',
                vendorId: info.usbVendorId,
                productId: info.usbProductId,
                rawDevice: port,
            },
        };
    } catch (err: unknown) {
        const errorObj = err as { name?: string; message?: string };
        if (errorObj.name === 'NotFoundError') {
            return { success: false, message: 'Device selection was cancelled.' };
        }
        return {
            success: false,
            message: `Could not open Bluetooth SPP port: ${errorObj.message || 'Unknown error'}`,
        };
    }
}

/**
 * Known Thermal Printer USB Vendor IDs
 */
const KNOWN_PRINTER_VENDORS = [
    { vendorId: 0x0416 }, // Winbond / Xprinter / POS-58
    { vendorId: 0x0483 }, // STMicroelectronics (Common in Chinese ESC/POS)
    { vendorId: 0x04b8 }, // Seiko Epson
    { vendorId: 0x0519 }, // Star Micronics
    { vendorId: 0x0fe6 }, // ICS Advent / Generic POS
    { vendorId: 0x1fc9 }, // NXP Semiconductors
    { vendorId: 0x0dd4 }, // Custom Engineering
    { vendorId: 0x1a86 }, // QinHeng Electronics (CH340 USB-Serial ESC/POS)
    { vendorId: 0x10c4 }, // Silicon Labs (CP210x USB-Serial)
    { vendorId: 0x0403 }, // FTDI
    { vendorId: 0x067b }, // Prolific PL2303
    { vendorId: 0x6868 }, // Xprinter / Zhuhai
    { vendorId: 0x0525 }, // Netchip POS
    { vendorId: 0x28e9 }, // GigaDevice POS
    { vendorId: 0x20d1 }, // Zjiang POS58
    { vendorId: 0x8888 }, // Generic 58mm Thermal
    { vendorId: 0x09c5 }, // Generic USB POS
    { vendorId: 0x0456 }, // Analog Devices POS
    { vendorId: 0x1003 }, // Winpos
];

/**
 * Scan & Request a Direct WebUSB Thermal Printer
 */
export async function scanAndRequestWebUsbPrinter(): Promise<{
    success: boolean;
    printer?: DetectedPrinter;
    message?: string;
}> {
    if (!isWebUsbSupported()) {
        return {
            success: false,
            message: 'Direct WebUSB is not supported in this browser. Please use Chrome/Edge or the Local Print Bridge.',
        };
    }

    try {
        const usb = (navigator as unknown as { usb: { requestDevice(options: { filters: Array<{ vendorId?: number; classCode?: number }> }): Promise<WebUSBDevice> } }).usb;
        
        const device = await usb.requestDevice({
            filters: [
                ...KNOWN_PRINTER_VENDORS,
                { classCode: 7 },
            ]
        });

        if (!device) {
            return { success: false, message: 'No printer selected.' };
        }

        const printerName = device.productName || `USB Thermal Printer (${device.vendorId.toString(16)}:${device.productId.toString(16)})`;

        savePrinterConfig({
            connection_type: 'direct_usb',
            printer_name: printerName,
            direct_device_vendor_id: device.vendorId,
            direct_device_product_id: device.productId,
            direct_device_serial: device.serialNumber || '',
        });

        await connectWebUsbDevice(device);

        return {
            success: true,
            printer: {
                id: `usb_${device.vendorId}_${device.productId}`,
                name: printerName,
                isDefault: true,
                port: `USB VID:0x${device.vendorId.toString(16).toUpperCase()} PID:0x${device.productId.toString(16).toUpperCase()}`,
                type: 'webusb',
                vendorId: device.vendorId,
                productId: device.productId,
                rawDevice: device,
            },
        };
    } catch (err: unknown) {
        const errorObj = err as { name?: string; message?: string };
        if (errorObj.name === 'NotFoundError') {
            return { success: false, message: 'Device selection was cancelled.' };
        }
        if (errorObj.name === 'SecurityError') {
            return { success: false, message: 'Printer access was denied. Please allow USB device access.' };
        }
        return {
            success: false,
            message: `Could not connect to USB printer: ${errorObj.message || 'Unknown error'}. If locked by Windows driver, use Local Print Bridge.`,
        };
    }
}

/**
 * Connect to an already paired WebUSB device
 */
export async function connectWebUsbDevice(device: WebUSBDevice): Promise<{ success: boolean; message?: string }> {
    try {
        if (!device.opened) {
            await device.open();
        }

        if (device.configuration === null) {
            await device.selectConfiguration(1);
        }

        const interfaceNumber = device.configuration?.interfaces?.[0]?.interfaceNumber ?? 0;
        await device.claimInterface(interfaceNumber);

        const iface = device.configuration?.interfaces?.find((i: WebUSBInterface) => i.interfaceNumber === interfaceNumber) || device.configuration?.interfaces?.[0];
        const alternate = iface?.alternate || iface?.alternates?.[0];
        const outEndpoint = alternate?.endpoints?.find((ep: WebUSBEndpoint) => ep.direction === 'out' && ep.type === 'bulk')
            || alternate?.endpoints?.find((ep: WebUSBEndpoint) => ep.direction === 'out');

        if (!outEndpoint) {
            throw new Error('No compatible OUT bulk endpoint found on this thermal printer.');
        }

        activeUsbDevice = device;
        activeUsbEndpoint = outEndpoint.endpointNumber;

        return { success: true };
    } catch (err: unknown) {
        const errorObj = err as { message?: string };
        console.warn('[Direct WebUSB] Failed to claim interface:', err);
        return {
            success: false,
            message: errorObj.message || 'Failed to claim USB printer interface. Windows driver may have locked the device.',
        };
    }
}

/**
 * Scan & Request a Direct Web Serial Thermal Printer
 */
export async function scanAndRequestWebSerialPrinter(baudRate = 9600): Promise<{
    success: boolean;
    printer?: DetectedPrinter;
    message?: string;
}> {
    return await scanAndRequestBluetoothSppPrinter(baudRate);
}

/**
 * Retrieve all already-authorized direct browser devices (Serial/Bluetooth SPP, WebUSB)
 * Instantly populates connected hardware without prompting.
 */
export async function getAuthorizedDirectPrinters(): Promise<DetectedPrinter[]> {
    const list: DetectedPrinter[] = [];

    // 1. Check authorized Serial / Bluetooth SPP ports
    if (isWebSerialSupported()) {
        try {
            const serial = (navigator as unknown as { serial: { getPorts(): Promise<WebSerialPort[]> } }).serial;
            const ports = await serial.getPorts();
            for (let i = 0; i < ports.length; i++) {
                const p = ports[i];
                const info = p.getInfo ? p.getInfo() : {};
                const name = info.usbVendorId 
                    ? `Serial Device (0x${info.usbVendorId.toString(16)}:0x${(info.usbProductId || 0).toString(16)})`
                    : `POS58D Bluetooth SPP Port`;
                list.push({
                    id: `serial_auth_${i}_${info.usbVendorId || 'bt'}`,
                    name: name,
                    isDefault: i === 0,
                    port: `Bluetooth SPP Link (COM)`,
                    type: 'webserial',
                    vendorId: info.usbVendorId,
                    productId: info.usbProductId,
                    rawDevice: p,
                });
            }
        } catch {
            void 0;
        }
    }

    // 2. Check authorized WebUSB devices
    if (isWebUsbSupported()) {
        try {
            const usb = (navigator as unknown as { usb: { getDevices(): Promise<WebUSBDevice[]> } }).usb;
            const devices = await usb.getDevices();
            for (let i = 0; i < devices.length; i++) {
                const d = devices[i];
                list.push({
                    id: `usb_auth_${d.vendorId}_${d.productId}`,
                    name: d.productName || `USB Thermal Printer (${d.vendorId.toString(16)}:${d.productId.toString(16)})`,
                    isDefault: list.length === 0,
                    port: `USB VID:0x${d.vendorId.toString(16).toUpperCase()} PID:0x${d.productId.toString(16).toUpperCase()}`,
                    type: 'webusb',
                    vendorId: d.vendorId,
                    productId: d.productId,
                    rawDevice: d,
                });
            }
        } catch {
            void 0;
        }
    }

    return list;
}

/**
 * Instantly connect to a selected DetectedPrinter (Serial, WebUSB, or BLE)
 */
export async function connectDirectDevice(
    printer: DetectedPrinter,
    baudRate = 9600
): Promise<{ success: boolean; message: string }> {
    if (printer.type === 'webserial') {
        const port = printer.rawDevice as WebSerialPort;
        if (!port) {
            return { success: false, message: 'Invalid serial port device handle.' };
        }

        try {
            if (activeSerialPort && activeSerialPort !== port) {
                try {
                    await activeSerialPort.close?.();
                } catch {
                    void 0;
                }
                activeSerialPort = null;
            }

            let isOpen = false;
            try {
                if (port.readable || port.writable) isOpen = true;
            } catch {
                void 0;
            }

            if (!isOpen) {
                try {
                    await port.open({ baudRate });
                } catch (openErr: unknown) {
                    const errStr = String(openErr);
                    if (!errStr.includes('already open') && (openErr as { name?: string })?.name !== 'InvalidStateError') {
                        throw openErr;
                    }
                }
            }

            activeSerialPort = port;
            savePrinterConfig({
                connection_type: 'direct_bluetooth',
                printer_name: printer.name,
                baud_rate: baudRate,
                direct_device_vendor_id: printer.vendorId,
                direct_device_product_id: printer.productId,
            });

            return { success: true, message: `Connected to ${printer.name}` };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return { success: false, message: `Could not open serial port: ${msg}` };
        }
    }

    if (printer.type === 'webusb') {
        const dev = printer.rawDevice as WebUSBDevice;
        if (!dev) {
            return { success: false, message: 'Invalid USB device handle.' };
        }

        const res = await connectWebUsbDevice(dev);
        if (res.success) {
            savePrinterConfig({
                connection_type: 'direct_usb',
                printer_name: printer.name,
                direct_device_vendor_id: dev.vendorId,
                direct_device_product_id: dev.productId,
                direct_device_serial: dev.serialNumber || '',
            });
            return { success: true, message: `Connected to ${printer.name}` };
        }
        return { success: false, message: res.message || 'Failed to connect to USB printer.' };
    }

    return { success: true, message: `Selected ${printer.name}` };
}

/**
 * Attempt to restore paired direct Bluetooth / USB / Serial connection on page startup
 */
export async function restoreDirectDeviceConnection(): Promise<DetectedPrinter | null> {
    const config = getPrinterConfig();
    if (config.connection_type !== 'direct_usb' && config.connection_type !== 'direct_bluetooth') {
        return null;
    }

    // 1. Try Web Serial (Bluetooth SPP / Virtual COM)
    if (isWebSerialSupported()) {
        try {
            const serial = (navigator as unknown as { serial: { getPorts(): Promise<WebSerialPort[]> } }).serial;
            const ports = await serial.getPorts();
            if (ports && ports.length > 0) {
                const port = ports[0];
                let isAlreadyOpen = false;
                try {
                    if (port.readable || port.writable) isAlreadyOpen = true;
                } catch {
                    void 0;
                }

                if (!isAlreadyOpen) {
                    try {
                        await port.open({ baudRate: config.baud_rate || 9600 });
                    } catch (err: unknown) {
                        if ((err as { name?: string })?.name !== 'InvalidStateError' && !String(err).includes('already open')) {
                            throw err;
                        }
                    }
                }

                activeSerialPort = port;
                const info = port.getInfo ? port.getInfo() : {};
                return {
                    id: `serial_${info.usbVendorId || 'port'}`,
                    name: config.printer_name || 'POS58D Bluetooth Printer',
                    isDefault: true,
                    port: `Serial ${config.baud_rate || 9600} baud`,
                    type: 'webserial',
                    vendorId: info.usbVendorId,
                    productId: info.usbProductId,
                    rawDevice: port,
                };
            }
        } catch {
            // Ignore serial auto-connect failure
        }
    }

    // 2. Try WebUSB paired devices
    if (isWebUsbSupported()) {
        try {
            const usb = (navigator as unknown as { usb: { getDevices(): Promise<WebUSBDevice[]> } }).usb;
            const devices = await usb.getDevices();
            if (devices && devices.length > 0) {
                const matched = config.direct_device_vendor_id
                    ? devices.find((d: WebUSBDevice) => d.vendorId === config.direct_device_vendor_id && d.productId === config.direct_device_product_id)
                    : devices[0];

                const dev = matched || devices[0];
                const res = await connectWebUsbDevice(dev);
                if (res.success) {
                    return {
                        id: `usb_${dev.vendorId}_${dev.productId}`,
                        name: dev.productName || config.printer_name || 'USB Thermal Printer',
                        isDefault: true,
                        port: `USB VID:0x${dev.vendorId.toString(16).toUpperCase()} PID:0x${dev.productId.toString(16).toUpperCase()}`,
                        type: 'webusb',
                        vendorId: dev.vendorId,
                        productId: dev.productId,
                        rawDevice: dev,
                    };
                }
            }
        } catch {
            // Ignore auto-connect failure
        }
    }

    return null;
}

/**
 * Send raw binary ESC/POS bytes directly through browser hardware API (WebBluetooth / WebSerial / WebUSB)
 */
export async function sendRawToDirectHardware(bytes: Uint8Array): Promise<{ success: boolean; message: string }> {
    // 1. Direct Web Bluetooth (BLE GATT)
    if (activeBluetoothCharacteristic) {
        try {
            // Chunk transmission into 512-byte MTU blocks for BLE stability
            const CHUNK_SIZE = 512;
            for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
                const chunk = bytes.subarray(offset, Math.min(bytes.length, offset + CHUNK_SIZE));
                const copy = new Uint8Array(chunk);
                if (activeBluetoothCharacteristic.writeValueWithoutResponse) {
                    await activeBluetoothCharacteristic.writeValueWithoutResponse(copy);
                } else {
                    await activeBluetoothCharacteristic.writeValue(copy);
                }
            }
            return { success: true, message: 'Receipt printed directly via Web Bluetooth.' };
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            console.warn('[Direct WebBluetooth Print Error]:', err);
            return {
                success: false,
                message: `Bluetooth communication error: ${errorObj.message || 'Device disconnected'}.`,
            };
        }
    }

    // 2. Direct Web Serial (Bluetooth Classic SPP / COM Links)
    if (activeSerialPort && activeSerialPort.writable) {
        try {
            const writer = activeSerialPort.writable.getWriter();
            await writer.write(bytes);
            writer.releaseLock();
            return { success: true, message: 'Receipt printed directly via Bluetooth SPP.' };
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            console.warn('[Direct WebSerial Print Error]:', err);
            return {
                success: false,
                message: `Direct Serial communication error: ${errorObj.message || 'Port unavailable'}.`,
            };
        }
    }

    // 3. Direct WebUSB
    if (activeUsbDevice && activeUsbEndpoint !== null) {
        try {
            if (!activeUsbDevice.opened) {
                await activeUsbDevice.open();
            }
            const result = await activeUsbDevice.transferOut(activeUsbEndpoint, bytes);
            if (result.status === 'ok') {
                return { success: true, message: 'Receipt printed directly via WebUSB.' };
            }
            return { success: false, message: `WebUSB transfer returned status: ${result.status}` };
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            console.warn('[Direct WebUSB Print Error]:', err);
            return {
                success: false,
                message: `Direct USB communication error: ${errorObj.message || 'Printer unavailable'}. Please verify USB cable.`,
            };
        }
    }

    // Attempt auto-reconnect before giving up
    const restored = await restoreDirectDeviceConnection();
    if (restored) {
        return await sendRawToDirectHardware(bytes);
    }

    return {
        success: false,
        message: 'No direct Bluetooth or USB thermal printer is currently connected. Please click "Scan for Printers" to pair.',
    };
}

/**
 * Disconnect and close active direct Bluetooth / USB / Serial devices
 */
export async function disconnectDirectHardware(): Promise<void> {
    if (activeBluetoothDevice && activeBluetoothDevice.gatt?.connected) {
        try {
            activeBluetoothDevice.gatt.disconnect();
        } catch (_err) {
            void _err;
        }
        activeBluetoothDevice = null;
        activeBluetoothCharacteristic = null;
    }

    if (activeUsbDevice) {
        try {
            if (activeUsbDevice.opened) {
                await activeUsbDevice.close();
            }
        } catch (_err) {
            void _err;
        }
        activeUsbDevice = null;
        activeUsbEndpoint = null;
    }

    if (activeSerialPort) {
        try {
            await activeSerialPort.close();
        } catch (_err) {
            void _err;
        }
        activeSerialPort = null;
    }
}

// ── 3. LOCAL DESKTOP PRINT BRIDGE ADAPTER (127.0.0.1:18181) ──

/**
 * Probe local print bridge health
 */
export async function checkPrintBridgeHealth(): Promise<{ isHealthy: boolean; uptime?: number; queuePending?: number }> {
    try {
        const res = await axios.get(`${LOCAL_BRIDGE_URL}/health`, {
            timeout: 1800,
        });
        if (res.status === 200 && res.data?.status === 'ok') {
            return {
                isHealthy: true,
                uptime: res.data?.uptime_seconds,
                queuePending: res.data?.queue_pending,
            };
        }
        return { isHealthy: false };
    } catch {
        return { isHealthy: false };
    }
}

/**
 * Fetch list of detected OS printers from local print bridge
 */
export async function getAvailablePrinters(): Promise<{ success: boolean; printers: DetectedPrinter[]; message?: string }> {
    try {
        const res = await axios.get(`${LOCAL_BRIDGE_URL}/printers`, {
            timeout: 3000,
        });
        if (res.status === 200 && res.data?.success && Array.isArray(res.data?.printers)) {
            const formatted: DetectedPrinter[] = res.data.printers.map((p: { name: string; isDefault?: boolean; port?: string }) => ({
                id: `spooler_${p.name}`,
                name: p.name,
                isDefault: !!p.isDefault,
                port: p.port || 'USB/SPOOL',
                type: 'windows_spooler',
            }));
            return {
                success: true,
                printers: formatted,
            };
        }
        return {
            success: false,
            printers: [],
            message: res.data?.message || 'Failed to detect printers',
        };
    } catch (err: unknown) {
        return {
            success: false,
            printers: [],
            message: axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Print bridge unreachable',
        };
    }
}

/**
 * Fetch list of registered companion print bridges from Laravel Cloud API
 */
export async function fetchRegisteredBridges(branchId?: number): Promise<{ success: boolean; bridges: RegisteredBridge[] }> {
    try {
        const url = branchId ? `/api/v1/pos/print-bridges?branch_id=${branchId}` : '/api/v1/pos/print-bridges';
        const res = await axios.get(url, { timeout: 4000 });
        if (res.status === 200 && res.data?.success && Array.isArray(res.data?.bridges)) {
            return {
                success: true,
                bridges: res.data.bridges,
            };
        }
        return { success: false, bridges: [] };
    } catch {
        return { success: false, bridges: [] };
    }
}

/**
 * Dispatch cloud-based diagnostic test print job for Android Companion Bridge
 */
export async function sendCloudTestPrintJob(branchId: number, terminalId?: string): Promise<{ success: boolean; message: string }> {
    try {
        const res = await axios.post('/api/v1/pos/print-jobs/test', {
            branch_id: branchId,
            terminal_id: terminalId,
        }, { timeout: 5000 });

        if (res.status === 200 && res.data?.success) {
            return {
                success: true,
                message: 'Test print job queued. The Android Companion Bridge will print it automatically.',
            };
        }
        return {
            success: false,
            message: res.data?.message || 'Failed to queue test print job',
        };
    } catch (err: unknown) {
        const msg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Server communication error';
        return {
            success: false,
            message: msg,
        };
    }
}

/**
 * Dispatch POS receipt print job to local print bridge
 */
export async function sendToLocalPrintBridge(
    job: LocalPrintJobPayload,
    customConfig?: Partial<PrinterConfig>
): Promise<{ success: boolean; message: string }> {
    const config = { ...getPrinterConfig(), ...customConfig };

    const payload = {
        job_uuid: job.job_uuid,
        order_number: job.order_number,
        printer_name: config.printer_name || job.printer_name,
        connection_type: config.connection_type || job.connection_type || 'usb',
        tcp_host: config.tcp_host || job.tcp_host,
        tcp_port: config.tcp_port || job.tcp_port,
        paper_width: config.paper_width || job.paper_width || 58,
        raw_escpos_base64: job.raw_escpos_base64,
        formatted_text: job.formatted_text,
    };

    try {
        const res = await axios.post(`${LOCAL_BRIDGE_URL}/print`, payload, {
            timeout: 10000,
        });

        const isSuccess = res.status === 200 && res.data?.success;

        if (job.job_uuid) {
            axios.post(`/api/v1/pos/print-jobs/${job.job_uuid}/status`, {
                status: isSuccess ? 'printed' : 'failed',
                error: isSuccess ? null : (res.data?.message || 'Spooling failed'),
            }).catch(() => {});
        }

        return {
            success: isSuccess,
            message: res.data?.message || 'Receipt sent to thermal printer',
        };
    } catch (err: unknown) {
        const errMsg = axios.isAxiosError(err) 
            ? (err.response?.data?.message || err.message) 
            : 'Local print bridge is unreachable. Please make sure the print service is running.';

        if (job.job_uuid) {
            axios.post(`/api/v1/pos/print-jobs/${job.job_uuid}/status`, {
                status: 'failed',
                error: errMsg,
            }).catch(() => {});
        }

        return {
            success: false,
            message: errMsg,
        };
    }
}

// ── 4. UNIFIED MULTI-TIER THERMAL PRINTER DISPATCHER ──

/**
 * Universal print dispatcher for MAKI DESU POS receipts
 */
export async function printReceiptToThermalPrinter(
    job: LocalPrintJobPayload,
    customConfig?: Partial<PrinterConfig>
): Promise<{ success: boolean; message: string }> {
    const config = { ...getPrinterConfig(), ...customConfig };

    // Direct WebBluetooth / WebSerial / WebUSB Mode
    if (config.connection_type === 'direct_bluetooth' || config.connection_type === 'direct_usb') {
        let escposBytes: Uint8Array;

        if (job.receipt_data) {
            escposBytes = buildReceiptEscPos(job.receipt_data, config.paper_width);
        } else if (job.raw_escpos_base64) {
            const binaryString = atob(job.raw_escpos_base64);
            escposBytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                escposBytes[i] = binaryString.charCodeAt(i);
            }
        } else if (job.formatted_text) {
            const enc = new TextEncoder();
            escposBytes = enc.encode(job.formatted_text);
        } else {
            return { success: false, message: 'No receipt payload provided for printing.' };
        }

        const directResult = await sendRawToDirectHardware(escposBytes);
        
        if (job.job_uuid) {
            axios.post(`/api/v1/pos/print-jobs/${job.job_uuid}/status`, {
                status: directResult.success ? 'printed' : 'failed',
                error: directResult.success ? null : directResult.message,
            }).catch(() => {});
        }

        if (directResult.success) {
            return directResult;
        }

        // Silent fallback to local desktop bridge if running
        const bridgeHealth = await checkPrintBridgeHealth();
        if (bridgeHealth.isHealthy) {
            console.log('[Print Service] Falling back from Direct mode to Local Desktop Bridge...');
            return await sendToLocalPrintBridge(job, { ...config, connection_type: 'usb' });
        }

        return directResult;
    }

    // Local Desktop Print Bridge or Network Mode
    return await sendToLocalPrintBridge(job, config);
}

/**
 * Universal Test Print Dispatcher for 58mm/80mm diagnostics
 */
export async function sendTestPrint(
    branchName = 'VICTORIA',
    customConfig?: Partial<PrinterConfig>,
    branchId?: number
): Promise<{ success: boolean; message: string }> {
    const config = { ...getPrinterConfig(), ...customConfig };

    // Direct Bluetooth / USB Test Print
    if (config.connection_type === 'direct_bluetooth' || config.connection_type === 'direct_usb') {
        const interfaceLabel = config.connection_type === 'direct_bluetooth' ? 'Direct Bluetooth' : 'Direct USB';
        const testBytes = buildTestReceiptEscPos(branchName, config.paper_width, interfaceLabel);
        return await sendRawToDirectHardware(testBytes);
    }

    // Android Companion Bridge Test Print
    if (config.connection_type === 'android_bridge' && branchId) {
        return await sendCloudTestPrintJob(branchId, config.selected_bridge_uuid);
    }

    // Local Desktop Print Bridge Test Print
    try {
        const res = await axios.post(`${LOCAL_BRIDGE_URL}/test-print`, {
            branch_name: branchName,
            printer_name: config.printer_name,
            connection_type: config.connection_type,
            tcp_host: config.tcp_host,
            tcp_port: config.tcp_port,
            paper_width: config.paper_width,
        }, {
            timeout: 8000,
        });

        if (res.status === 200 && res.data?.success) {
            return {
                success: true,
                message: res.data.message || 'Test receipt spooled successfully',
            };
        }
        return {
            success: false,
            message: res.data?.message || 'Test print failed',
        };
    } catch (err: unknown) {
        const errMsg = axios.isAxiosError(err) 
            ? (err.response?.data?.message || err.message) 
            : 'Print bridge unreachable. Please verify that the bridge service is running.';
        return {
            success: false,
            message: errMsg,
        };
    }
}

// ── 5. REACT HOOK FOR PRINTER MANAGEMENT & LIVE STATUS ──

export function usePrinterStatus(branchId?: number) {
    const [status, setStatus] = useState<PrinterBridgeStatus>('checking');
    const [config, setConfig] = useState<PrinterConfig>(getPrinterConfig);
    const [printers, setPrinters] = useState<DetectedPrinter[]>([]);
    const [bridges, setBridges] = useState<RegisteredBridge[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [activeDirectPrinter, setActiveDirectPrinter] = useState<DetectedPrinter | null>(null);

    const isMountedRef = useRef(true);

    const updateConfig = useCallback((updates: Partial<PrinterConfig>) => {
        const updated = savePrinterConfig(updates);
        setConfig(updated);
        return updated;
    }, []);

    const checkNow = useCallback(async () => {
        const currentConfig = getPrinterConfig();

        if (currentConfig.connection_type === 'direct_bluetooth' || currentConfig.connection_type === 'direct_usb') {
            if (activeBluetoothCharacteristic || activeUsbDevice || activeSerialPort) {
                setStatus('ready');
                return true;
            }
            const restored = await restoreDirectDeviceConnection();
            if (restored) {
                setActiveDirectPrinter(restored);
                setStatus('ready');
                return true;
            }
            setStatus('disconnected');
            return false;
        }

        const health = await checkPrintBridgeHealth();
        if (health.isHealthy) {
            setStatus('ready');
            return true;
        }

        setStatus('offline');
        return false;
    }, []);

    const scanForPrinters = useCallback(async (mode?: PrinterConnectionType): Promise<{
        success: boolean;
        foundCount: number;
        printers: DetectedPrinter[];
        message?: string;
    }> => {
        setIsScanning(true);
        setStatus('scanning');
        const targetMode = mode || config.connection_type;

        try {
            // A. Direct Bluetooth Scanner (Bluetooth SPP via Web Serial or BLE via Web Bluetooth)
            if (targetMode === 'direct_bluetooth') {
                // Try Bluetooth SPP / Serial first (Standard for POS58D on Windows)
                if (isWebSerialSupported()) {
                    const sppRes = await scanAndRequestBluetoothSppPrinter(config.baud_rate || 9600);
                    setIsScanning(false);
                    if (sppRes.success && sppRes.printer) {
                        setActiveDirectPrinter(sppRes.printer);
                        setPrinters([sppRes.printer]);
                        setStatus('ready');
                        updateConfig({
                            connection_type: 'direct_bluetooth',
                            printer_name: sppRes.printer.name,
                        });
                        return {
                            success: true,
                            foundCount: 1,
                            printers: [sppRes.printer],
                            message: `Connected to ${sppRes.printer.name}`,
                        };
                    }
                }

                // Try Web Bluetooth BLE
                if (isWebBluetoothSupported()) {
                    const bleRes = await scanAndRequestWebBluetoothPrinter();
                    setIsScanning(false);
                    if (bleRes.success && bleRes.printer) {
                        setActiveDirectPrinter(bleRes.printer);
                        setPrinters([bleRes.printer]);
                        setStatus('ready');
                        updateConfig({
                            connection_type: 'direct_bluetooth',
                            printer_name: bleRes.printer.name,
                        });
                        return {
                            success: true,
                            foundCount: 1,
                            printers: [bleRes.printer],
                            message: `Connected to ${bleRes.printer.name}`,
                        };
                    }
                }

                setIsScanning(false);
                setStatus('disconnected');
                return {
                    success: false,
                    foundCount: 0,
                    printers: [],
                    message: 'No Bluetooth printer connected.',
                };
            }

            // B. Direct WebUSB Scanner
            if (targetMode === 'direct_usb') {
                const res = await scanAndRequestWebUsbPrinter();
                setIsScanning(false);

                if (res.success && res.printer) {
                    setActiveDirectPrinter(res.printer);
                    setPrinters([res.printer]);
                    setStatus('ready');
                    updateConfig({
                        connection_type: 'direct_usb',
                        printer_name: res.printer.name,
                    });
                    return {
                        success: true,
                        foundCount: 1,
                        printers: [res.printer],
                        message: `Successfully connected to ${res.printer.name}`,
                    };
                }

                setStatus('disconnected');
                return {
                    success: false,
                    foundCount: 0,
                    printers: [],
                    message: res.message || 'No compatible USB printer detected.',
                };
            }

            // C. Local Desktop Print Bridge Scanner
            if (targetMode === 'usb') {
                const health = await checkPrintBridgeHealth();
                if (!health.isHealthy) {
                    setIsScanning(false);
                    setStatus('offline');
                    return {
                        success: false,
                        foundCount: 0,
                        printers: [],
                        message: 'Local print bridge is not running on this computer.',
                    };
                }

                const listRes = await getAvailablePrinters();
                setIsScanning(false);
                setStatus('ready');
                setPrinters(listRes.printers);

                return {
                    success: listRes.success,
                    foundCount: listRes.printers.length,
                    printers: listRes.printers,
                    message: listRes.printers.length > 0 
                        ? `Found ${listRes.printers.length} installed printer(s)`
                        : 'No printers found in Windows spooler.',
                };
            }

            // D. Android Companion Scanner
            if (targetMode === 'android_bridge') {
                const bridgeRes = await fetchRegisteredBridges(branchId);
                setIsScanning(false);
                setBridges(bridgeRes.bridges);
                const onlineBridges = bridgeRes.bridges.filter(b => b.is_online);
                setStatus(onlineBridges.length > 0 ? 'ready' : 'disconnected');

                return {
                    success: bridgeRes.success,
                    foundCount: onlineBridges.length,
                    printers: [],
                    message: onlineBridges.length > 0
                        ? `${onlineBridges.length} active Android companion bridge(s) ready`
                        : 'No active Android bridges found for this branch.',
                };
            }

            setIsScanning(false);
            return { success: true, foundCount: 0, printers: [] };
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            setIsScanning(false);
            setStatus('offline');
            return {
                success: false,
                foundCount: 0,
                printers: [],
                message: errorObj.message || 'Scan failed.',
            };
        }
    }, [branchId, config.connection_type, config.baud_rate, updateConfig]);

    const disconnectCurrentPrinter = useCallback(async () => {
        await disconnectDirectHardware();
        setActiveDirectPrinter(null);
        setStatus('disconnected');
    }, []);

    useEffect(() => {
        isMountedRef.current = true;

        const initStatus = async () => {
            if (config.connection_type === 'direct_bluetooth' || config.connection_type === 'direct_usb') {
                const restored = await restoreDirectDeviceConnection();
                if (isMountedRef.current) {
                    if (restored) {
                        setActiveDirectPrinter(restored);
                        setPrinters([restored]);
                        setStatus('ready');
                    } else {
                        setStatus('disconnected');
                    }
                }
            } else {
                const health = await checkPrintBridgeHealth();
                if (isMountedRef.current) {
                    setStatus(health.isHealthy ? 'ready' : 'offline');
                    if (health.isHealthy) {
                        const printerRes = await getAvailablePrinters();
                        if (isMountedRef.current && printerRes.success) {
                            setPrinters(printerRes.printers);
                        }
                    }
                }
            }

            const bridgeRes = await fetchRegisteredBridges(branchId);
            if (isMountedRef.current && bridgeRes.success) {
                setBridges(bridgeRes.bridges);
            }
        };

        initStatus();

        return () => {
            isMountedRef.current = false;
        };
    }, [branchId, config.connection_type]);

    const isConnected = status === 'ready' || (config.connection_type === 'android_bridge' && bridges.some(b => b.is_online));

    return {
        status,
        isConnected,
        config,
        printers,
        bridges,
        isScanning,
        activeDirectPrinter,
        directUsbCapabilities: {
            isWebUsbSupported: isWebUsbSupported(),
            isWebSerialSupported: isWebSerialSupported(),
            isWebBluetoothSupported: isWebBluetoothSupported(),
        },
        updateConfig,
        checkNow,
        scanForPrinters,
        disconnectCurrentPrinter,
    };
}

/**
 * Trigger native browser thermal print targeting the 58mm receipt layout (Final Fallback)
 */
export function triggerBrowserThermalPrint(): void {
    if (typeof window !== 'undefined') {
        window.print();
    }
}
