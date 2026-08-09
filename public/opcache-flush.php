<?php
// TEMPORARY: Delete this file immediately after use!
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo json_encode(['status' => 'ok', 'message' => 'OPcache flushed successfully.']);
} else {
    echo json_encode(['status' => 'warn', 'message' => 'opcache_reset() not available on this server.']);
}
