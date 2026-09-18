package com.makidesu.printbridge

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class PrintJobPollingService : LifecycleService() {

    companion object {
        const val TAG = "MakiPollingService"
        const val NOTIFICATION_CHANNEL_ID = "maki_print_bridge_channel"
        const val NOTIFICATION_ID = 101

        const val EXTRA_SERVER_URL = "extra_server_url"
        const val EXTRA_BRIDGE_UUID = "extra_bridge_uuid"
        const val EXTRA_BRANCH_ID = "extra_branch_id"
        const val EXTRA_TERMINAL_ID = "extra_terminal_id"
        const val EXTRA_PRINTER_MAC = "extra_printer_mac"
        const val EXTRA_PRINTER_NAME = "extra_printer_name"

        var isRunning = false
            private set

        var onLogMessage: ((String) -> Unit)? = null
        var onPrinterStatusChanged: ((Boolean) -> Unit)? = null
    }

    private lateinit var apiClient: ApiClient
    private lateinit var printerManager: BluetoothPrinterManager
    private var pollingJob: Job? = null
    private var heartbeatJob: Job? = null

    private var serverUrl: String = "https://makidesuoperation.site"
    private var bridgeUuid: String = "VICTORIA-POS-01"
    private var branchId: Int = 1
    private var terminalId: String? = null
    private var printerMac: String? = null
    private var printerName: String? = null

    override fun onCreate() {
        super.onCreate()
        printerManager = BluetoothPrinterManager(this)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)

        serverUrl = intent?.getStringExtra(EXTRA_SERVER_URL) ?: serverUrl
        bridgeUuid = intent?.getStringExtra(EXTRA_BRIDGE_UUID) ?: bridgeUuid
        branchId = intent?.getIntExtra(EXTRA_BRANCH_ID, 1) ?: 1
        terminalId = intent?.getStringExtra(EXTRA_TERMINAL_ID)
        printerMac = intent?.getStringExtra(EXTRA_PRINTER_MAC)
        printerName = intent?.getStringExtra(EXTRA_PRINTER_NAME)

        apiClient = ApiClient(serverUrl)

        startForeground(NOTIFICATION_ID, buildNotification("Listening for POS print jobs on branch $branchId..."))
        isRunning = true

        log("[SERVICE] Started Print Bridge Service ($bridgeUuid)")
        startPolling()
        startHeartbeat()

        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        pollingJob?.cancel()
        heartbeatJob?.cancel()
        printerManager.disconnect()
        log("[SERVICE] Stopped Print Bridge Service")
    }

    override fun onBind(intent: Intent): IBinder? {
        super.onBind(intent)
        return null
    }

    private fun startPolling() {
        pollingJob?.cancel()
        pollingJob = lifecycleScope.launch(Dispatchers.IO) {
            // First register bridge
            val regReq = PrintBridgeRegisterRequest(
                bridgeUuid = bridgeUuid,
                name = "Android Companion ($bridgeUuid)",
                branchId = branchId,
                terminalId = terminalId,
                deviceType = "android",
                pairedPrinterName = printerName,
                pairedPrinterAddress = printerMac,
                connectionType = "bluetooth_spp",
                batteryLevel = getBatteryLevel()
            )
            apiClient.registerBridge(regReq)

            while (isActive) {
                try {
                    val pendingRes = apiClient.fetchPendingJobs(bridgeUuid, branchId)
                    if (pendingRes.isSuccess) {
                        val jobs = pendingRes.getOrNull() ?: emptyList()
                        for (job in jobs) {
                            processPrintJob(job)
                        }
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Polling tick warning: ${e.message}")
                }
                delay(1800) // Poll interval 1.8s
            }
        }
    }

    private suspend fun processPrintJob(job: RemotePrintJob) {
        log("[JOB] Received Order #${job.orderNumber} (${job.jobType}) for 58mm thermal print")

        // 1. Claim job atomically
        val claimRes = apiClient.claimJob(bridgeUuid, job.jobUuid)
        if (claimRes.isFailure) {
            log("[JOB] Skipped Order #${job.orderNumber}: Already claimed by another station")
            return
        }

        // 2. Decode print bytes
        val bytes = EscPosUtils.getPrintBytes(job)

        // 3. Connect & Send to Bluetooth Printer
        val mac = printerMac
        if (mac.isNullOrBlank()) {
            log("[ERROR] No Bluetooth printer selected. Please select a paired thermal printer.")
            apiClient.updateJobStatus(bridgeUuid, job.jobUuid, "failed", "No Bluetooth printer configured")
            return
        }

        val sendRes = printerManager.sendBytes(bytes, mac)
        if (sendRes.isSuccess) {
            log("[SUCCESS] ✓ Order #${job.orderNumber} printed successfully via Bluetooth SPP")
            apiClient.updateJobStatus(bridgeUuid, job.jobUuid, "printed", null)
            onPrinterStatusChanged?.invoke(true)
        } else {
            val err = sendRes.exceptionOrNull()?.message ?: "Bluetooth communication failure"
            log("[ERROR] Failed to print Order #${job.orderNumber}: $err")
            apiClient.updateJobStatus(bridgeUuid, job.jobUuid, "failed", err)
            onPrinterStatusChanged?.invoke(false)
        }
    }

    private fun startHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = lifecycleScope.launch(Dispatchers.IO) {
            while (isActive) {
                try {
                    val hbReq = PrintBridgeHeartbeatRequest(
                        bridgeUuid = bridgeUuid,
                        batteryLevel = getBatteryLevel(),
                        status = if (printerManager.isConnected()) "online" else "online"
                    )
                    apiClient.sendHeartbeat(hbReq)
                } catch (_: Exception) {}
                delay(30000) // 30s heartbeat
            }
        }
    }

    private fun getBatteryLevel(): Int? {
        return try {
            val bm = getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
            bm?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        } catch (_: Exception) {
            null
        }
    }

    private fun log(msg: String) {
        Log.i(TAG, msg)
        lifecycleScope.launch(Dispatchers.Main) {
            onLogMessage?.invoke(msg)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "MAKI DESU Print Bridge Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background service maintaining Bluetooth thermal printer connectivity"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(contentText: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("MAKI DESU Print Bridge")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_agenda)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }
}
