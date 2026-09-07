<?php

echo "\n=======================================================\n";
echo "       HOSTINGER PHP & COMPOSER ENVIRONMENT DIAGNOSIS   \n";
echo "=======================================================\n\n";

echo "1. PHP Binary:            " . PHP_BINARY . "\n";
echo "2. PHP Version:           " . PHP_VERSION . "\n";
echo "3. Loaded php.ini:        " . (php_ini_loaded_file() ?: 'None') . "\n";
echo "4. Additional ini files:  " . (php_ini_scanned_files() ?: 'None') . "\n";

echo "\n--- PROCESS FUNCTIONS CHECK ---\n";
$procFunctions = ['proc_open', 'proc_close', 'proc_get_status', 'proc_terminate', 'shell_exec', 'exec', 'system', 'passthru', 'popen'];
foreach ($procFunctions as $fn) {
    $exists = function_exists($fn);
    echo sprintf(" %-20s: %s\n", $fn, $exists ? '✅ AVAILABLE' : '❌ DISABLED');
}

echo "\n--- DISABLE_FUNCTIONS INI SETTING ---\n";
$disabled = ini_get('disable_functions');
echo $disabled ? "disable_functions = $disabled\n" : "disable_functions is EMPTY (No functions disabled)\n";

echo "\n--- COMPOSER DIAGNOSIS ---\n";
if (function_exists('shell_exec')) {
    $composerPath = trim(@shell_exec('which composer 2>&1') ?? '');
    echo "Composer binary:          " . ($composerPath ?: 'Not in PATH') . "\n";
} else {
    echo "Composer binary:          (Cannot check via shell_exec - function is disabled)\n";
}

echo "\n=======================================================\n";
