<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use SplFileObject;

/**
 * LogViewerService
 *
 * Safely reads and parses Laravel log files from the approved log directory.
 * NO arbitrary filesystem paths accepted — all sources are server-side configured.
 * Sensitive data is redacted before any content is returned.
 */
class LogViewerService
{
    /**
     * Approved log source identifiers mapped to their filesystem paths/types.
     * These are the ONLY sources that may be read.
     */
    private const APPROVED_SOURCES = [
        'laravel'   => ['type' => 'laravel_dir',  'path' => null],     // storage/logs/*.log
        'php'       => ['type' => 'php_errorlog',  'path' => null],     // php_ini error_log
        'queue'     => ['type' => 'laravel_file',  'path' => 'queue.log'],
        'scheduler' => ['type' => 'laravel_file',  'path' => 'schedule.log'],
        'horizon'   => ['type' => 'laravel_file',  'path' => 'horizon.log'],
    ];

    /**
     * Patterns to redact from log content before returning.
     */
    private const REDACT_PATTERNS = [
        '/("password"\s*:\s*")[^"]+(")/i'          => '$1[REDACTED]$2',
        '/("secret[_\w]*"\s*:\s*")[^"]+(")/i'      => '$1[REDACTED]$2',
        '/("token"\s*:\s*")[^"]+(")/i'             => '$1[REDACTED]$2',
        '/("api_key[_\w]*"\s*:\s*")[^"]+(")/i'     => '$1[REDACTED]$2',
        '/(Bearer\s+)[A-Za-z0-9\-_\.]+/i'         => '$1[REDACTED]',
        '/(APP_KEY|DB_PASSWORD|JWT_SECRET)[=:]\s*\S+/i' => '$1=[REDACTED]',
        '/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/' => '[EMAIL REDACTED]',
    ];

    /**
     * Monolog log line regex pattern.
     * Matches: [2026-08-28 12:34:56] production.ERROR: Message {"key":"val"} []
     */
    private const LOG_PATTERN =
        '/^\[(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:\d{2}|Z)?)\]\s+' .
        '(\w+)\.(\w+):\s+(.*?)(\{.*\})?\s*(\[.*\])?\s*$/s';

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get availability/status for all approved log sources.
     */
    public function getSourceStatuses(): array
    {
        $statuses = [];
        foreach (self::APPROVED_SOURCES as $key => $config) {
            $statuses[$key] = $this->checkSourceStatus($key, $config);
        }
        return $statuses;
    }

    /**
     * List available log files for the 'laravel' source.
     * Only files matching laravel*.log pattern in storage/logs are returned.
     */
    public function listLaravelLogFiles(): array
    {
        $dir = storage_path('logs');
        if (! is_dir($dir)) {
            return [];
        }

        $files = [];
        $items = glob($dir . '/laravel*.log');
        if ($items === false) {
            return [];
        }

        foreach ($items as $path) {
            if (is_file($path) && is_readable($path)) {
                $files[] = [
                    'filename' => basename($path),
                    'size'     => filesize($path),
                    'modified' => filemtime($path),
                ];
            }
        }

        // Also include queue, schedule, horizon logs listed separately
        foreach (['queue.log', 'schedule.log', 'horizon.log'] as $extra) {
            $p = $dir . '/' . $extra;
            if (is_file($p) && is_readable($p)) {
                $files[] = [
                    'filename' => $extra,
                    'size'     => filesize($p),
                    'modified' => filemtime($p),
                ];
            }
        }

        usort($files, fn($a, $b) => $b['modified'] - $a['modified']);
        return $files;
    }

    /**
     * Read and parse log entries from an approved source.
     *
     * @param  string      $source   Approved source key (laravel, php, queue, …)
     * @param  string|null $filename Specific log filename (only valid for laravel source, basename only)
     * @param  string      $level    Log level filter ('all' or specific level)
     * @param  string      $search   Free-text search
     * @param  string|null $dateFrom ISO date string
     * @param  string|null $dateTo   ISO date string
     * @param  int         $page
     * @param  int         $perPage  Max 200
     * @return array{entries:array, total:int, stats:array, page:int, perPage:int, lastPage:int}
     */
    public function getEntries(
        string  $source,
        ?string $filename = null,
        string  $level = 'all',
        string  $search = '',
        ?string $dateFrom = null,
        ?string $dateTo = null,
        int     $page = 1,
        int     $perPage = 50
    ): array {
        // Clamp perPage to prevent abuse
        $perPage = min(max($perPage, 10), 200);

        $path = $this->resolveApprovedPath($source, $filename);

        if ($path === null || ! is_file($path) || ! is_readable($path)) {
            return $this->emptyResult($page, $perPage);
        }

        $allEntries = $this->parseLogFile($path);

        // Filter
        $filtered = array_filter($allEntries, function (array $entry) use ($level, $search, $dateFrom, $dateTo) {
            if ($level !== 'all' && strtolower($entry['level'] ?? '') !== strtolower($level)) {
                return false;
            }

            if ($dateFrom && ($entry['timestamp'] ?? '') < $dateFrom) {
                return false;
            }
            if ($dateTo && ($entry['timestamp'] ?? '') > $dateTo . 'T23:59:59') {
                return false;
            }

            if ($search !== '') {
                $needle = strtolower($search);
                $haystack = strtolower(($entry['message'] ?? '') . ' ' . ($entry['context'] ?? '') . ' ' . ($entry['trace'] ?? ''));
                if (! str_contains($haystack, $needle)) {
                    return false;
                }
            }

            return true;
        });

        // Already newest-first from parse; re-index
        $filtered = array_values($filtered);
        $total    = count($filtered);

        // Stats
        $stats = $this->buildStats($filtered);

        // Paginate
        $offset  = ($page - 1) * $perPage;
        $page_entries = array_slice($filtered, $offset, $perPage);
        $lastPage = max(1, (int) ceil($total / $perPage));

        return [
            'entries'  => $page_entries,
            'total'    => $total,
            'stats'    => $stats,
            'page'     => $page,
            'perPage'  => $perPage,
            'lastPage' => $lastPage,
        ];
    }

    /**
     * Get newest N entries for live-mode polling.
     * Returns only entries newer than $afterTimestamp.
     */
    public function getNewEntries(string $source, ?string $filename, string $afterTimestamp): array
    {
        $path = $this->resolveApprovedPath($source, $filename);
        if ($path === null || ! is_file($path) || ! is_readable($path)) {
            return [];
        }

        $allEntries = $this->parseLogFile($path, 200); // only last 200 lines for live

        return array_values(array_filter($allEntries, function ($e) use ($afterTimestamp) {
            return ($e['timestamp'] ?? '') > $afterTimestamp;
        }));
    }

    /**
     * Download raw content of an approved log file.
     */
    public function getRawContent(string $source, ?string $filename): ?string
    {
        $path = $this->resolveApprovedPath($source, $filename);
        if ($path === null || ! is_file($path) || ! is_readable($path)) {
            return null;
        }

        // Cap raw download at 5MB
        $size = filesize($path);
        if ($size > 5 * 1024 * 1024) {
            return $this->readLastBytes($path, 5 * 1024 * 1024);
        }

        return $this->redact(file_get_contents($path));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function resolveApprovedPath(string $source, ?string $filename): ?string
    {
        if (! array_key_exists($source, self::APPROVED_SOURCES)) {
            return null;
        }

        $config = self::APPROVED_SOURCES[$source];

        switch ($config['type']) {
            case 'laravel_dir':
                // filename must be basename only — no directory traversal
                $basename = $filename ? basename($filename) : 'laravel.log';
                // Only allow laravel*.log, queue.log, schedule.log, horizon.log
                if (! $this->isApprovedFilename($basename)) {
                    return null;
                }
                return storage_path('logs/' . $basename);

            case 'laravel_file':
                return storage_path('logs/' . $config['path']);

            case 'php_errorlog':
                $iniPath = ini_get('error_log');
                if ($iniPath && is_file($iniPath) && is_readable($iniPath)) {
                    return $iniPath;
                }
                // Fallback: some hosts write to storage/logs
                $fallback = storage_path('logs/php_errors.log');
                return is_file($fallback) ? $fallback : null;

            default:
                return null;
        }
    }

    private function isApprovedFilename(string $basename): bool
    {
        // Only allow: laravel.log, laravel-YYYY-MM-DD.log, queue.log, schedule.log, horizon.log
        return (bool) preg_match('/^(laravel(-\d{4}-\d{2}-\d{2})?|queue|schedule|horizon)\.log$/', $basename);
    }

    private function checkSourceStatus(string $key, array $config): array
    {
        switch ($config['type']) {
            case 'laravel_dir':
                $path = storage_path('logs/laravel.log');
                $exists = is_file($path);
                $readable = $exists && is_readable($path);
                return [
                    'available' => $readable,
                    'reason'    => $readable ? 'Laravel application log file is accessible.' : ($exists ? 'File exists but is not readable.' : 'Log file not yet created.'),
                    'path_hint' => 'storage/logs/laravel.log',
                    'source'    => 'Laravel application logging system (Monolog)',
                ];

            case 'laravel_file':
                $path = storage_path('logs/' . $config['path']);
                $readable = is_file($path) && is_readable($path);
                return [
                    'available' => $readable,
                    'reason'    => $readable ? 'Log file is accessible.' : 'Log file does not exist yet (no activity recorded).',
                    'path_hint' => 'storage/logs/' . $config['path'],
                    'source'    => 'Laravel application logging system',
                ];

            case 'php_errorlog':
                $iniPath = ini_get('error_log');
                if ($iniPath && is_file($iniPath) && is_readable($iniPath)) {
                    return [
                        'available' => true,
                        'reason'    => 'PHP error log is accessible via php.ini configuration.',
                        'path_hint' => basename($iniPath),
                        'source'    => 'PHP runtime error log (php.ini)',
                    ];
                }
                $fallback = storage_path('logs/php_errors.log');
                if (is_file($fallback) && is_readable($fallback)) {
                    return [
                        'available' => true,
                        'reason'    => 'PHP error log found at application fallback location.',
                        'path_hint' => 'storage/logs/php_errors.log',
                        'source'    => 'PHP runtime error log',
                    ];
                }
                return [
                    'available' => false,
                    'reason'    => 'PHP error log is not accessible from the current Hostinger environment. The php.ini error_log directive points to a location outside the web application\'s read permissions.',
                    'path_hint' => null,
                    'source'    => 'PHP runtime error log (php.ini)',
                ];

            default:
                return ['available' => false, 'reason' => 'Unknown source type.', 'path_hint' => null, 'source' => ''];
        }
    }

    /**
     * Parse a Laravel log file into structured entries.
     * Reads from end of file backward so recent entries come first.
     * @param int $maxLines limit lines scanned (0 = all)
     */
    private function parseLogFile(string $path, int $maxLines = 0): array
    {
        $entries = [];
        $rawChunk = '';

        // Read the file tail-first for efficiency on large files
        $lines = $this->readLinesReversed($path, max($maxLines, 5000));

        $currentEntry = null;

        foreach ($lines as $line) {
            $line = rtrim($line);

            if (preg_match('/^\[(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:\d{2}|Z)?)\]\s+(\w+)\.(\w+):\s+(.*)$/s', $line, $m)) {
                // Save previous entry
                if ($currentEntry !== null) {
                    $entries[] = $this->finalizeEntry($currentEntry);
                }
                $currentEntry = [
                    'timestamp'   => str_replace(' ', 'T', $m[1]),
                    'environment' => $m[2],
                    'level'       => strtoupper($m[3]),
                    'raw_message' => $m[4],
                    'extra_lines' => [],
                ];
            } elseif ($currentEntry !== null) {
                // Continuation / stack trace line
                array_unshift($currentEntry['extra_lines'], $line);
            }
        }

        if ($currentEntry !== null) {
            $entries[] = $this->finalizeEntry($currentEntry);
        }

        return $entries;
    }

    private function finalizeEntry(array $raw): array
    {
        $message = $raw['raw_message'];
        $context = null;
        $trace   = null;

        // Try to split message / context JSON / stack trace
        // Context is often at end: "message {\"key\":\"val\"} []"
        if (preg_match('/^(.*?)(\{.*\})\s*(\[.*\])?\s*$/s', $message, $cm)) {
            $message = trim($cm[1]);
            $context = $this->redact($cm[2]);
        }

        // Stack trace from extra_lines
        $extraText = implode("\n", $raw['extra_lines']);
        if ($extraText !== '') {
            $trace = $this->redact($extraText);
        }

        // Extract exception class from message
        $exception = null;
        if (preg_match('/\b([A-Za-z\\\\]+Exception|[A-Za-z\\\\]+Error|[A-Za-z\\\\]+Throwable)\b/', $message, $em)) {
            $exception = $em[1];
        }

        // Extract file & line from trace
        $file = null;
        $line = null;
        if ($trace && preg_match('/#\d+\s+([\/\w\-\. ]+\.php)\((\d+)\)/', $trace, $fm)) {
            $file = $fm[1];
            $line = (int) $fm[2];
        }

        $id = hash('xxh32', $raw['timestamp'] . $raw['level'] . $message);

        return [
            'id'          => $id,
            'timestamp'   => $raw['timestamp'],
            'environment' => $raw['environment'],
            'level'       => $raw['level'],
            'message'     => $this->redact($message),
            'context'     => $context,
            'trace'       => $trace,
            'exception'   => $exception,
            'file'        => $file,
            'line'        => $line,
        ];
    }

    private function buildStats(array $entries): array
    {
        $stats = ['total' => count($entries), 'debug' => 0, 'info' => 0, 'notice' => 0, 'warning' => 0, 'error' => 0, 'critical' => 0, 'alert' => 0, 'emergency' => 0];
        foreach ($entries as $e) {
            $lvl = strtolower($e['level'] ?? '');
            if (array_key_exists($lvl, $stats)) {
                $stats[$lvl]++;
            }
        }
        return $stats;
    }

    /**
     * Read a file's lines in reverse order (tail-first) without loading entirely.
     */
    private function readLinesReversed(string $path, int $maxLines): array
    {
        $size = filesize($path);
        if ($size === 0) {
            return [];
        }

        // Cap at 10MB to protect memory
        $readBytes = min($size, 10 * 1024 * 1024);

        $fh = fopen($path, 'rb');
        if (! $fh) {
            return [];
        }

        fseek($fh, -$readBytes, SEEK_END);
        $content = fread($fh, $readBytes);
        fclose($fh);

        $lines = explode("\n", $content);
        $lines = array_reverse($lines);

        if ($maxLines > 0) {
            $lines = array_slice($lines, 0, $maxLines);
        }

        return $lines;
    }

    private function readLastBytes(string $path, int $bytes): string
    {
        $size = filesize($path);
        $fh   = fopen($path, 'rb');
        if (! $fh) {
            return '';
        }
        fseek($fh, -min($size, $bytes), SEEK_END);
        $content = fread($fh, min($size, $bytes));
        fclose($fh);
        return $this->redact($content);
    }

    private function redact(string $content): string
    {
        foreach (self::REDACT_PATTERNS as $pattern => $replacement) {
            $content = preg_replace($pattern, $replacement, $content) ?? $content;
        }
        return $content;
    }

    private function emptyResult(int $page, int $perPage): array
    {
        return [
            'entries'  => [],
            'total'    => 0,
            'stats'    => ['total' => 0, 'debug' => 0, 'info' => 0, 'notice' => 0, 'warning' => 0, 'error' => 0, 'critical' => 0, 'alert' => 0, 'emergency' => 0],
            'page'     => $page,
            'perPage'  => $perPage,
            'lastPage' => 1,
        ];
    }
}
