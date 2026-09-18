package com.makidesu.printbridge

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.OutputStream
import java.util.UUID

class BluetoothPrinterManager(private val context: Context) {

    companion object {
        private const val TAG = "MakiBluetoothPrinter"

        // Standard Serial Port Profile (SPP) UUID used by Loyverse & thermal printers
        val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    }

    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    private var activeSocket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null
    private var connectedDeviceAddress: String? = null

    val isBluetoothSupported: Boolean
        get() = bluetoothAdapter != null

    val isBluetoothEnabled: Boolean
        get() = bluetoothAdapter?.isEnabled == true

    /**
     * Get list of currently paired / bonded Bluetooth devices on this Android device
     */
    @SuppressLint("MissingPermission")
    fun getPairedPrinters(): List<BluetoothDeviceItem> {
        if (!isBluetoothSupported || !isBluetoothEnabled) {
            return emptyList()
        }

        return try {
            val paired = bluetoothAdapter?.bondedDevices ?: emptySet()
            paired.map { device ->
                val name = device.name ?: "Unknown Bluetooth Device"
                BluetoothDeviceItem(name, device.address)
            }.sortedBy { it.name }
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching bonded devices: ${e.message}")
            emptyList()
        }
    }

    /**
     * Connect or reuse connection to specified Bluetooth MAC address via SPP RFCOMM socket
     */
    @SuppressLint("MissingPermission")
    suspend fun connect(macAddress: String): Result<Unit> = withContext(Dispatchers.IO) {
        if (isConnected() && connectedDeviceAddress == macAddress) {
            return@withContext Result.success(Unit)
        }

        disconnect()

        try {
            val device: BluetoothDevice = bluetoothAdapter?.getRemoteDevice(macAddress)
                ?: return@withContext Result.failure(Exception("Bluetooth device not found for address: $macAddress"))

            // Cancel discovery before connecting to ensure full bandwidth and prevent connection failures
            bluetoothAdapter.cancelDiscovery()

            Log.d(TAG, "Opening RFCOMM SPP socket to ${device.name} ($macAddress)...")
            val socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
            socket.connect()

            activeSocket = socket
            outputStream = socket.outputStream
            connectedDeviceAddress = macAddress

            Log.i(TAG, "✓ Successfully connected to Bluetooth Thermal Printer: ${device.name}")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to connect to Bluetooth printer ($macAddress): ${e.message}")
            disconnect()
            Result.failure(e)
        }
    }

    /**
     * Stream raw ESC/POS bytes to the connected thermal printer in safe chunks
     */
    suspend fun sendBytes(bytes: ByteArray, macAddress: String? = null): Result<Unit> = withContext(Dispatchers.IO) {
        if (macAddress != null && connectedDeviceAddress != macAddress) {
            val connRes = connect(macAddress)
            if (connRes.isFailure) {
                return@withContext Result.failure(connRes.exceptionOrNull() ?: Exception("Connection failed"))
            }
        }

        if (!isConnected()) {
            return@withContext Result.failure(Exception("Printer is not connected"))
        }

        try {
            val stream = outputStream ?: return@withContext Result.failure(Exception("Output stream unavailable"))
            
            // Stream in 128-byte chunks with slight delay to prevent hardware buffer overrun
            val chunkSize = 128
            var offset = 0
            while (offset < bytes.size) {
                val len = minOf(chunkSize, bytes.size - offset)
                stream.write(bytes, offset, len)
                stream.flush()
                offset += len
                if (offset < bytes.size) {
                    Thread.sleep(15)
                }
            }

            Log.d(TAG, "✓ Sent ${bytes.size} bytes to thermal printer")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Error writing bytes to printer: ${e.message}")
            disconnect()
            Result.failure(e)
        }
    }

    fun isConnected(): Boolean {
        return activeSocket?.isConnected == true && outputStream != null
    }

    fun disconnect() {
        try {
            outputStream?.flush()
            outputStream?.close()
        } catch (_: Exception) {}

        try {
            activeSocket?.close()
        } catch (_: Exception) {}

        outputStream = null
        activeSocket = null
        connectedDeviceAddress = null
    }
}
