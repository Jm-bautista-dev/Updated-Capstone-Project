package com.makidesu.printbridge

import com.google.gson.annotations.SerializedName

data class PrintBridgeRegisterRequest(
    @SerializedName("bridge_uuid") val bridgeUuid: String,
    @SerializedName("name") val name: String,
    @SerializedName("branch_id") val branchId: Int,
    @SerializedName("terminal_id") val terminalId: String?,
    @SerializedName("device_type") val deviceType: String = "android",
    @SerializedName("paired_printer_name") val pairedPrinterName: String?,
    @SerializedName("paired_printer_address") val pairedPrinterAddress: String?,
    @SerializedName("connection_type") val connectionType: String = "bluetooth_spp",
    @SerializedName("battery_level") val batteryLevel: Int? = null
)

data class PrintBridgeHeartbeatRequest(
    @SerializedName("bridge_uuid") val bridgeUuid: String,
    @SerializedName("battery_level") val batteryLevel: Int?,
    @SerializedName("status") val status: String = "online"
)

data class PendingJobsResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("count") val count: Int,
    @SerializedName("jobs") val jobs: List<RemotePrintJob>?
)

data class RemotePrintJob(
    @SerializedName("id") val id: Long,
    @SerializedName("job_uuid") val jobUuid: String,
    @SerializedName("order_number") val orderNumber: String,
    @SerializedName("branch_id") val branchId: Int,
    @SerializedName("terminal_id") val terminalId: String?,
    @SerializedName("job_type") val jobType: String,
    @SerializedName("paper_width") val paperWidth: Int,
    @SerializedName("status") val status: String,
    @SerializedName("raw_escpos_base64") val rawEscposBase64: String?,
    @SerializedName("formatted_text") val formattedText: String?,
    @SerializedName("receipt_data") val receiptData: Map<String, Any>?
)

data class ClaimJobResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("print_job") val printJob: RemotePrintJob?
)

data class UpdateStatusRequest(
    @SerializedName("status") val status: String,
    @SerializedName("error") val error: String? = null
)

data class BluetoothDeviceItem(
    val name: String,
    val address: String
) {
    override fun toString(): String = "$name ($address)"
}
