package com.makidesu.printbridge

import android.util.Base64
import java.io.ByteArrayOutputStream
import java.nio.charset.Charset
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object EscPosUtils {

    private val CP437 = Charset.forName("CP437")

    // ESC/POS Command Constants
    val ESC: Byte = 0x1B
    val GS: Byte = 0x1D
    val LF: Byte = 0x0A

    /**
     * Generate 58mm (32 column) diagnostic test receipt
     */
    fun generate58mmTestReceipt(branchName: String = "VICTORIA", terminalId: String = "POS-01"): ByteArray {
        val out = ByteArrayOutputStream()

        // 1. Initialize Printer
        out.write(byteArrayOf(ESC, '@'.code.toByte()))

        // 2. Select Code Page CP437
        out.write(byteArrayOf(ESC, 't'.code.toByte(), 0x00))

        // 3. Center Align & Bold Title
        out.write(byteArrayOf(ESC, 'a'.code.toByte(), 0x01)) // Center
        out.write(byteArrayOf(GS, '!'.code.toByte(), 0x11))  // Double width & height
        out.write(byteArrayOf(ESC, 'E'.code.toByte(), 0x01)) // Bold on
        out.write("MAKI DESU\n".toByteArray(CP437))
        out.write(byteArrayOf(GS, '!'.code.toByte(), 0x00))  // Normal size
        out.write("${branchName.uppercase()}\n".toByteArray(CP437))
        out.write(byteArrayOf(ESC, 'E'.code.toByte(), 0x00)) // Bold off
        out.write("--------------------------------\n".toByteArray(CP437))

        // 4. Test Banner
        out.write(byteArrayOf(ESC, 'E'.code.toByte(), 0x01))
        out.write("*** ANDROID BRIDGE TEST ***\n".toByteArray(CP437))
        out.write(byteArrayOf(ESC, 'E'.code.toByte(), 0x00))
        out.write("--------------------------------\n".toByteArray(CP437))

        // 5. Details
        out.write(byteArrayOf(ESC, 'a'.code.toByte(), 0x00)) // Left
        val dateStr = SimpleDateFormat("MMM dd, yyyy hh:mm a", Locale.US).format(Date())
        out.write("Date: $dateStr\n".toByteArray(CP437))
        out.write("Terminal: $terminalId\n".toByteArray(CP437))
        out.write("Transport: Android Bluetooth SPP\n".toByteArray(CP437))
        out.write("Paper Width: 58mm (32 cols)\n".toByteArray(CP437))
        out.write("--------------------------------\n".toByteArray(CP437))

        // 6. Test line items
        out.write(byteArrayOf(ESC, 'E'.code.toByte(), 0x01))
        out.write(formatTwoColumn("Item (Qty)", "Price", 32).toByteArray(CP437))
        out.write("\n".toByteArray(CP437))
        out.write(byteArrayOf(ESC, 'E'.code.toByte(), 0x00))
        out.write("--------------------------------\n".toByteArray(CP437))

        out.write(formatTwoColumn("Sample Item x1", "PHP 150.00", 32).toByteArray(CP437))
        out.write("\n".toByteArray(CP437))
        out.write("--------------------------------\n".toByteArray(CP437))

        out.write(byteArrayOf(ESC, 'E'.code.toByte(), 0x01))
        out.write(formatTwoColumn("TOTAL", "PHP 150.00", 32).toByteArray(CP437))
        out.write("\n".toByteArray(CP437))
        out.write(byteArrayOf(ESC, 'E'.code.toByte(), 0x00))
        out.write("--------------------------------\n".toByteArray(CP437))

        // 7. Footer
        out.write(byteArrayOf(ESC, 'a'.code.toByte(), 0x01)) // Center
        out.write("TEST PRINT SUCCESSFUL!\n".toByteArray(CP437))
        out.write("Android Bridge is ready for POS.\n".toByteArray(CP437))

        // 8. Feed 4 lines & Cut
        out.write("\n\n\n\n".toByteArray(CP437))
        out.write(byteArrayOf(GS, 'V'.code.toByte(), 0x41, 0x10))

        return out.toByteArray()
    }

    /**
     * Decode base64 or fallback to plain text CP437 byte stream
     */
    fun getPrintBytes(job: RemotePrintJob): ByteArray {
        if (!job.rawEscposBase64.isNullOrBlank()) {
            return Base64.decode(job.rawEscposBase64, Base64.DEFAULT)
        }

        val text = job.formattedText ?: "MAKI DESU RECEIPT\nOrder: ${job.orderNumber}\n\n\n\n"
        val out = ByteArrayOutputStream()
        out.write(byteArrayOf(ESC, '@'.code.toByte()))
        out.write(byteArrayOf(ESC, 't'.code.toByte(), 0x00))
        out.write(text.toByteArray(CP437))
        out.write("\n\n\n\n".toByteArray(CP437))
        out.write(byteArrayOf(GS, 'V'.code.toByte(), 0x41, 0x10))
        return out.toByteArray()
    }

    private fun formatTwoColumn(left: String, right: String, width: Int): String {
        val maxLeft = maxOf(1, width - right.length - 1)
        val trimmedLeft = if (left.length > maxLeft) left.substring(0, maxLeft) else left
        val spaces = maxOf(1, width - trimmedLeft.length - right.length)
        return trimmedLeft + " ".repeat(spaces) + right
    }
}
