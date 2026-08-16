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
    $bmp.Dispose()
    Write-Host "Saved: $outPath ($targetSize x $targetSize)"
}

Save-ResizedImage $srcImg 16 "C:\xampp\htdocs\Capstone-Project\public\favicon-16x16.png"
Save-ResizedImage $srcImg 32 "C:\xampp\htdocs\Capstone-Project\public\favicon-32x32.png"
Save-ResizedImage $srcImg 64 "C:\xampp\htdocs\Capstone-Project\public\favicon.png"
Save-ResizedImage $srcImg 180 "C:\xampp\htdocs\Capstone-Project\public\apple-touch-icon.png"

# Save 32x32 as favicon.ico
Copy-Item "C:\xampp\htdocs\Capstone-Project\public\favicon-32x32.png" "C:\xampp\htdocs\Capstone-Project\public\favicon.ico" -Force
Write-Host "Updated public/favicon.ico"

$srcImg.Dispose()
