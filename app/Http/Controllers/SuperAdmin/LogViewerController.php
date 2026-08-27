<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\LogViewerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response as LaravelResponse;
use Inertia\Inertia;
use Inertia\Response;

class LogViewerController extends Controller
{
    public function __construct(private LogViewerService $service) {}

    /**
     * GET /super-admin/logs
     * Main Logs page via Inertia.
     */
    public function index(Request $request): Response
    {
        $source   = $request->input('source', 'laravel');
        $filename = $request->input('filename');
        $level    = $request->input('level', 'all');
        $search   = $request->input('search', '');
        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');
        $page     = max(1, (int) $request->input('page', 1));
        $perPage  = (int) $request->input('per_page', 50);

        $sourceStatuses = $this->service->getSourceStatuses();
        $logFiles       = $this->service->listLaravelLogFiles();

        $result = $this->service->getEntries(
            source:   $source,
            filename: $filename,
            level:    $level,
            search:   $search,
            dateFrom: $dateFrom,
            dateTo:   $dateTo,
            page:     $page,
            perPage:  $perPage,
        );

        return Inertia::render('SuperAdmin/LogViewer', [
            'sourceStatuses' => $sourceStatuses,
            'logFiles'       => $logFiles,
            'entries'        => $result['entries'],
            'total'          => $result['total'],
            'stats'          => $result['stats'],
            'page'           => $result['page'],
            'perPage'        => $result['perPage'],
            'lastPage'       => $result['lastPage'],
            'filters'        => [
                'source'    => $source,
                'filename'  => $filename,
                'level'     => $level,
                'search'    => $search,
                'date_from' => $dateFrom,
                'date_to'   => $dateTo,
            ],
        ]);
    }

    /**
     * GET /super-admin/logs/entries (JSON — used for live polling & AJAX pagination)
     */
    public function entries(Request $request): JsonResponse
    {
        $source   = $request->input('source', 'laravel');
        $filename = $request->input('filename');
        $level    = $request->input('level', 'all');
        $search   = $request->input('search', '');
        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');
        $page     = max(1, (int) $request->input('page', 1));
        $perPage  = (int) $request->input('per_page', 50);

        $result = $this->service->getEntries(
            source:   $source,
            filename: $filename,
            level:    $level,
            search:   $search,
            dateFrom: $dateFrom,
            dateTo:   $dateTo,
            page:     $page,
            perPage:  $perPage,
        );

        return response()->json([
            'success' => true,
            ...$result,
        ]);
    }

    /**
     * GET /super-admin/logs/live (JSON — returns new entries after a timestamp)
     */
    public function live(Request $request): JsonResponse
    {
        $source         = $request->input('source', 'laravel');
        $filename       = $request->input('filename');
        $afterTimestamp = $request->input('after', '');

        $entries = $this->service->getNewEntries($source, $filename, $afterTimestamp);

        return response()->json([
            'success' => true,
            'entries' => $entries,
            'count'   => count($entries),
        ]);
    }

    /**
     * GET /super-admin/logs/sources (JSON — source status check)
     */
    public function sources(): JsonResponse
    {
        return response()->json([
            'success'  => true,
            'sources'  => $this->service->getSourceStatuses(),
            'logFiles' => $this->service->listLaravelLogFiles(),
        ]);
    }

    /**
     * GET /super-admin/logs/download — download approved log file
     */
    public function download(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $source   = $request->input('source', 'laravel');
        $filename = $request->input('filename', 'laravel.log');

        $content = $this->service->getRawContent($source, $filename);

        if ($content === null) {
            abort(404, 'Log file not accessible.');
        }

        $basename = $filename ? basename($filename) : 'laravel.log';

        return LaravelResponse::make($content, 200, [
            'Content-Type'        => 'text/plain; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$basename}\"",
        ]);
    }
}
