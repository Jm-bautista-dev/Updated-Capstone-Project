param(
    [Parameter(Mandatory=$false)]
    [string]$PrinterName = "",

    [Parameter(Mandatory=$true)]
    [string]$FilePath = "",

    [Parameter(Mandatory=$false)]
    [string]$TcpHost = "",

    [Parameter(Mandatory=$false)]
    [int]$TcpPort = 9100,

    [Parameter(Mandatory=$false)]
    [string]$ComPort = ""
)

# 1. TCP / Network Thermal Printer direct socket streaming
if ($TcpHost -ne "") {
    try {
        $bytes = [System.IO.File]::ReadAllBytes($FilePath)
        $client = New-Object System.Net.Sockets.TcpClient
        $client.Connect($TcpHost, $TcpPort)
        $stream = $client.GetStream()
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Flush()
        $stream.Close()
        $client.Close()
        Write-Output "SUCCESS: Printed to TCP $($TcpHost):$($TcpPort)"
        exit 0
    } catch {
        Write-Error "TCP Print Failed: $_"
        exit 1
    }
}

# 2. Serial / COM Port thermal printer streaming
if ($ComPort -ne "") {
    try {
        $bytes = [System.IO.File]::ReadAllBytes($FilePath)
        $port = New-Object System.IO.Ports.SerialPort $ComPort, 9600, [System.IO.Ports.Parity]::None, 8, [System.IO.Ports.StopBits]::One
        $port.Open()
        $port.Write($bytes, 0, $bytes.Length)
        $port.Close()
        Write-Output "SUCCESS: Printed to Serial $ComPort"
        exit 0
    } catch {
        Write-Error "Serial Print Failed: $_"
        exit 1
    }
}

# 3. Windows Native Raw Spooler (winspool.drv) via Win32 API
if ([string]::IsNullOrWhiteSpace($PrinterName)) {
    $defaultPrinter = Get-CimInstance Win32_Printer | Where-Object { $_.Default -eq $true } | Select-Object -ExpandProperty Name
    if (-not $defaultPrinter) {
        $defaultPrinter = Get-CimInstance Win32_Printer | Select-Object -First 1 -ExpandProperty Name
    }
    $PrinterName = $defaultPrinter
}

if ([string]::IsNullOrWhiteSpace($PrinterName)) {
    Write-Error "No Windows printer found or specified."
    exit 1
}

$csharpSource = @"
using System;
using System.IO;
using System.Runtime.InteropServices;

public class Win32RawPrinter {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static bool PrintRawFile(string printerName, string filePath) {
        if (!File.Exists(filePath)) return false;
        byte[] bytes = File.ReadAllBytes(filePath);

        IntPtr hPrinter = new IntPtr(0);
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "MAKI DESU Receipt";
        di.pDataType = "RAW";

        bool success = false;
        if (OpenPrinter(printerName, out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di)) {
                if (StartPagePrinter(hPrinter)) {
                    IntPtr pBytes = Marshal.AllocCoTaskMem(bytes.Length);
                    Marshal.Copy(bytes, 0, pBytes, bytes.Length);
                    int dwWritten = 0;
                    success = WritePrinter(hPrinter, pBytes, bytes.Length, out dwWritten);
                    Marshal.FreeCoTaskMem(pBytes);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        return success;
    }
}
"@

try {
    if (-not ([System.Management.Automation.PSTypeName]'Win32RawPrinter').Type) {
        Add-Type -TypeDefinition $csharpSource -Language CSharp
    }

    $res = [Win32RawPrinter]::PrintRawFile($PrinterName, $FilePath)
    if ($res) {
        Write-Output "SUCCESS: Raw print spooled to $PrinterName"
        exit 0
    } else {
        # Fallback to copy /b or Out-Printer
        Get-Content -Path $FilePath -Raw -Encoding Byte | Out-Printer -Name $PrinterName
        Write-Output "SUCCESS: Spooled via Out-Printer to $PrinterName"
        exit 0
    }
} catch {
    Write-Error "Windows Spooler Error: $_"
    exit 1
}
