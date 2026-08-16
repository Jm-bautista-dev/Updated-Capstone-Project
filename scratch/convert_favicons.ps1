Add-Type -AssemblyName System.Drawing

$srcPath = "C:\xampp\htdocs\Capstone-Project\public\images\maki-desu-logo.png"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Save-ResizedImage($src, $targetSize, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $ratio = [Math]::Min($targetSize / $src.Width, $targetSize / $src.Height)
    $newW = [int][Math]::Round($src.Width * $ratio)
    $newH = [int][Math]::Round($src.Height * $ratio)
    $dstX = [int][Math]::Round(($targetSize - $newW) / 2)
    $dstY = [int][Math]::Round(($targetSize - $newH) / 2)

    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, $dstX, $dstY, $newW, $newH)
    $g.Dispose()

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Saved: $outPath ($targetSize x $targetSize)"
    return $bmp
}

$bmp16 = Save-ResizedImage $srcImg 16 "C:\xampp\htdocs\Capstone-Project\public\favicon-16x16.png"
$bmp32 = Save-ResizedImage $srcImg 32 "C:\xampp\htdocs\Capstone-Project\public\favicon-32x32.png"
$bmp64 = Save-ResizedImage $srcImg 64 "C:\xampp\htdocs\Capstone-Project\public\favicon.png"
$bmp180 = Save-ResizedImage $srcImg 180 "C:\xampp\htdocs\Capstone-Project\public\apple-touch-icon.png"

# Save a real windows icon handle to favicon.ico
$hIcon = $bmp32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$stream = [System.IO.File]::Create("C:\xampp\htdocs\Capstone-Project\public\favicon.ico")
$icon.Save($stream)
$stream.Close()
$icon.Dispose()
Write-Host "Updated real binary public/favicon.ico"

$bmp16.Dispose()
$bmp32.Dispose()
$bmp64.Dispose()
$bmp180.Dispose()
$srcImg.Dispose()
