package com.makidesu.printbridge

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.text.method.ScrollingMovementMethod
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.makidesu.printbridge.databinding.ActivityMainBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: SharedPreferences
    private lateinit var printerManager: BluetoothPrinterManager
    private var pairedPrinters: List<BluetoothDeviceItem> = emptyList()

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.entries.all { it.value }
        if (allGranted) {
            refreshBluetoothPrinters()
        } else {
            Toast.makeText(this, "Bluetooth permissions are required to print receipts", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = getSharedPreferences("makidesu_print_bridge_prefs", Context.MODE_PRIVATE)
        printerManager = BluetoothPrinterManager(this)

        binding.tvPrintLogs.movementMethod = ScrollingMovementMethod()

        setupBranchSpinner()
        loadSavedPreferences()
        setupListeners()
        checkPermissionsAndLoadPrinters()

        PrintJobPollingService.onLogMessage = { msg ->
            runOnUiThread {
                binding.tvPrintLogs.append("$msg\n")
            }
        }

        PrintJobPollingService.onPrinterStatusChanged = { isOnline ->
            runOnUiThread {
                updatePrinterStatusDisplay(isOnline)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        updateServiceButtonState()
    }

    private fun setupBranchSpinner() {
        val branches = listOf("Maki Desu Victoria (ID: 1)", "Maki Desu Sta. Cruz (ID: 2)")
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, branches)
        binding.spnBranch.adapter = adapter
    }

    private fun loadSavedPreferences() {
        binding.etServerUrl.setText(prefs.getString("server_url", "https://makidesuoperation.site"))
        binding.etTerminalId.setText(prefs.getString("terminal_id", "POS-01"))
        binding.spnBranch.setSelection(prefs.getInt("branch_selection_index", 0))
    }

    private fun savePreferences() {
        val selectedPrinter = getSelectedPrinter()
        prefs.edit()
            .putString("server_url", binding.etServerUrl.text.toString().trim())
            .putString("terminal_id", binding.etTerminalId.text.toString().trim())
            .putInt("branch_selection_index", binding.spnBranch.selectedItemPosition)
            .putString("printer_mac", selectedPrinter?.address)
            .putString("printer_name", selectedPrinter?.name)
            .apply()
    }

    private fun setupListeners() {
        binding.btnRefreshPrinters.setOnClickListener {
            checkPermissionsAndLoadPrinters()
        }

        binding.btnTestPrint.setOnClickListener {
            runTestPrint()
        }

        binding.btnToggleService.setOnClickListener {
            toggleService()
        }
    }

    private fun checkPermissionsAndLoadPrinters() {
        val neededPermissions = mutableListOf<String>()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                neededPermissions.add(Manifest.permission.BLUETOOTH_CONNECT)
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
                neededPermissions.add(Manifest.permission.BLUETOOTH_SCAN)
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                neededPermissions.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        if (neededPermissions.isNotEmpty()) {
            permissionLauncher.launch(neededPermissions.toTypedArray())
        } else {
            refreshBluetoothPrinters()
        }
    }

    private fun refreshBluetoothPrinters() {
        pairedPrinters = printerManager.getPairedPrinters()
        if (pairedPrinters.isEmpty()) {
            val emptyList = listOf(BluetoothDeviceItem("No Paired Bluetooth Devices Found", ""))
            binding.spnBluetoothPrinters.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, emptyList)
            binding.tvPrinterStatus.text = "No paired Bluetooth printers. Please pair printer in Android Bluetooth Settings."
            binding.dotPrinterStatus.backgroundTintList = ContextCompat.getColorStateList(this, R.color.amber_500)
            return
        }

        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, pairedPrinters)
        binding.spnBluetoothPrinters.adapter = adapter

        // Restore previously selected printer
        val savedMac = prefs.getString("printer_mac", null)
        if (savedMac != null) {
            val index = pairedPrinters.indexOfFirst { it.address == savedMac }
            if (index >= 0) {
                binding.spnBluetoothPrinters.setSelection(index)
            }
        }

        binding.tvPrinterStatus.text = "Printer: ${pairedPrinters.size} Paired Devices Available (58mm ESC/POS)"
        binding.dotPrinterStatus.backgroundTintList = ContextCompat.getColorStateList(this, R.color.emerald_500)
    }

    private fun getSelectedPrinter(): BluetoothDeviceItem? {
        val pos = binding.spnBluetoothPrinters.selectedItemPosition
        return if (pos >= 0 && pos < pairedPrinters.size) pairedPrinters[pos] else null
    }

    private fun runTestPrint() {
        val printer = getSelectedPrinter()
        if (printer == null || printer.address.isBlank()) {
            Toast.makeText(this, "Please select a paired Bluetooth thermal printer first", Toast.LENGTH_SHORT).show()
            return
        }

        savePreferences()
        val branchName = if (binding.spnBranch.selectedItemPosition == 1) "STA. CRUZ" else "VICTORIA"
        val terminalId = binding.etTerminalId.text.toString().ifBlank { "POS-01" }

        binding.tvPrintLogs.append("[TEST] Spooling 58mm test receipt to ${printer.name} (${printer.address})...\n")

        lifecycleScope.launch(Dispatchers.IO) {
            val bytes = EscPosUtils.generate58mmTestReceipt(branchName, terminalId)
            val res = printerManager.sendBytes(bytes, printer.address)

            withContext(Dispatchers.Main) {
                if (res.isSuccess) {
                    binding.tvPrintLogs.append("[TEST] ✓ Test print successful! 58mm receipt printed.\n")
                    Toast.makeText(this@MainActivity, "✓ Test Receipt Printed!", Toast.LENGTH_SHORT).show()
                    updatePrinterStatusDisplay(true)
                } else {
                    val errMsg = res.exceptionOrNull()?.message ?: "Unknown communication failure"
                    binding.tvPrintLogs.append("[TEST] ✗ Test print failed: $errMsg\n")
                    Toast.makeText(this@MainActivity, "Test Print Failed: $errMsg", Toast.LENGTH_LONG).show()
                    updatePrinterStatusDisplay(false)
                }
            }
        }
    }

    private fun toggleService() {
        if (PrintJobPollingService.isRunning) {
            stopService(Intent(this, PrintJobPollingService::class.java))
            binding.tvPrintLogs.append("[UI] Print Bridge service stopped by user.\n")
            updateServiceButtonState()
        } else {
            val printer = getSelectedPrinter()
            if (printer == null || printer.address.isBlank()) {
                Toast.makeText(this, "Please select a paired Bluetooth thermal printer before starting", Toast.LENGTH_SHORT).show()
                return
            }

            savePreferences()
            val branchId = if (binding.spnBranch.selectedItemPosition == 1) 2 else 1
            val terminalId = binding.etTerminalId.text.toString().ifBlank { "POS-01" }
            val branchPrefix = if (branchId == 2) "STA-CRUZ" else "VICTORIA"
            val bridgeUuid = "$branchPrefix-$terminalId"

            val serviceIntent = Intent(this, PrintJobPollingService::class.java).apply {
                putExtra(PrintJobPollingService.EXTRA_SERVER_URL, binding.etServerUrl.text.toString().trim())
                putExtra(PrintJobPollingService.EXTRA_BRIDGE_UUID, bridgeUuid)
                putExtra(PrintJobPollingService.EXTRA_BRANCH_ID, branchId)
                putExtra(PrintJobPollingService.EXTRA_TERMINAL_ID, terminalId)
                putExtra(PrintJobPollingService.EXTRA_PRINTER_MAC, printer.address)
                putExtra(PrintJobPollingService.EXTRA_PRINTER_NAME, printer.name)
            }

            ContextCompat.startForegroundService(this, serviceIntent)
            binding.tvPrintLogs.append("[UI] Starting Print Bridge for $bridgeUuid ($serverUrl)...\n")
            updateServiceButtonState()
        }
    }

    private fun updateServiceButtonState() {
        if (PrintJobPollingService.isRunning) {
            binding.btnToggleService.text = "STOP SERVICE"
            binding.btnToggleService.backgroundTintList = ContextCompat.getColorStateList(this, R.color.rose_500)
            binding.tvBridgeStatusBadge.text = "ONLINE (ACTIVE)"
            binding.tvBridgeStatusBadge.backgroundTintList = ContextCompat.getColorStateList(this, R.color.emerald_700)
        } else {
            binding.btnToggleService.text = "START SERVICE"
            binding.btnToggleService.backgroundTintList = ContextCompat.getColorStateList(this, R.color.brand_pink)
            binding.tvBridgeStatusBadge.text = "STANDBY"
            binding.tvBridgeStatusBadge.backgroundTintList = ContextCompat.getColorStateList(this, R.color.gray_600)
        }
    }

    private fun updatePrinterStatusDisplay(isOnline: Boolean) {
        if (isOnline) {
            binding.tvPrinterStatus.text = "Printer: Connected & Ready (58mm ESC/POS SPP)"
            binding.dotPrinterStatus.backgroundTintList = ContextCompat.getColorStateList(this, R.color.emerald_500)
        } else {
            binding.tvPrinterStatus.text = "Printer: Disconnected / Offline"
            binding.dotPrinterStatus.backgroundTintList = ContextCompat.getColorStateList(this, R.color.rose_500)
        }
    }
}
