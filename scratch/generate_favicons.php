<?php

$srcPath = __DIR__ . '/../public/images/maki-desu-logo.png';

if (!file_exists($srcPath)) {
    die("Source image not found: {$srcPath}\n");
}

$raw = file_get_contents($srcPath);
$srcImage = imagecreatefromstring($raw);
if (!$srcImage) {
    die("Failed to parse image data\n");
}

$srcW = imagesx($srcImage);
$srcH = imagesy($srcImage);

imagealphablending($srcImage, true);
imagesavealpha($srcImage, true);

function createResizedFavicon($srcImage, $srcW, $srcH, $targetSize, $outputPath) {
    $dst = imagecreatetruecolor($targetSize, $targetSize);
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    
    $transparent = imagecolorallocatealpha($dst, 255, 255, 255, 127);
    imagefilledrectangle($dst, 0, 0, $targetSize, $targetSize, $transparent);
    
    $ratio = min($targetSize / $srcW, $targetSize / $srcH);
    $newW = (int) round($srcW * $ratio);
    $newH = (int) round($srcH * $ratio);
    $dstX = (int) round(($targetSize - $newW) / 2);
    $dstY = (int) round(($targetSize - $newH) / 2);

    imagecopyresampled($dst, $srcImage, $dstX, $dstY, 0, 0, $newW, $newH, $srcW, $srcH);
    imagepng($dst, $outputPath);
    imagedestroy($dst);
    echo "Generated: {$outputPath} ({$targetSize}x{$targetSize})\n";
}

createResizedFavicon($srcImage, $srcW, $srcH, 16, __DIR__ . '/../public/favicon-16x16.png');
createResizedFavicon($srcImage, $srcW, $srcH, 32, __DIR__ . '/../public/favicon-32x32.png');
createResizedFavicon($srcImage, $srcW, $srcH, 64, __DIR__ . '/../public/favicon.png');
createResizedFavicon($srcImage, $srcW, $srcH, 180, __DIR__ . '/../public/apple-touch-icon.png');

copy(__DIR__ . '/../public/favicon-32x32.png', __DIR__ . '/../public/favicon.ico');
echo "Updated public/favicon.ico\n";

imagedestroy($srcImage);
