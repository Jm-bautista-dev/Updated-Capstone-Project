<?php

$logoPath = __DIR__ . '/../public/images/maki-desu-logo.png';
if (file_exists($logoPath)) {
    list($width, $height) = getimagesize($logoPath);
    echo "maki-desu-logo.png dimensions: {$width}x{$height}\n";
} else {
    echo "maki-desu-logo.png not found\n";
}
