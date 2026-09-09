<?php

namespace Tests\Feature;

use App\Exports\DynamicExport;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class PerformanceLogExcelExportTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    public $branch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'    => 'Victoria Branch',
            'address' => 'Victoria, Laguna',
        ]);

        $this->admin = User::factory()->create([
            'name'      => 'Admin Supervisor',
            'role'      => 'admin',
            'branch_id' => $this->branch->id,
        ]);
    }

    /**
     * TEST 1: Performance Log Excel file generates an editable, unprotected worksheet by default.
     */
    public function test_performance_log_excel_export_is_unprotected_and_editable(): void
    {
        $payload = [
            'reportName'  => 'Performance Log',
            'branch'      => 'Victoria Branch',
            'dateRange'   => '2026-09-01 to 2026-09-09',
            'generatedBy' => 'Admin Supervisor',
            'kpis'        => [
                ['title' => 'Completed Orders', 'value' => '42'],
                ['title' => 'Total Inflow', 'value' => '₱18,500.00'],
            ],
            'columns'     => [
                ['title' => 'Cashier / Employee', 'key' => 'employee'],
                ['title' => 'Shift Date', 'key' => 'date'],
                ['title' => 'Transactions', 'key' => 'transactions'],
                ['title' => 'Total Sales', 'key' => 'sales'],
            ],
            'rows'        => [
                [
                    'employee'     => 'Maria Santos',
                    'date'         => '2026-09-09 08:00',
                    'transactions' => 24,
                    'sales'        => '₱10,250.00',
                ],
                [
                    'employee'     => 'Juan Dela Cruz',
                    'date'         => '2026-09-09 16:00',
                    'transactions' => 18,
                    'sales'        => '₱8,250.00',
                ],
            ],
        ];

        $exportFileName = 'test_performance_export_' . uniqid() . '.xlsx';
        Excel::store(new DynamicExport($payload), $exportFileName);
        $fullPath = \Illuminate\Support\Facades\Storage::path($exportFileName);

        $this->assertFileExists($fullPath);

        // Load through PhpSpreadsheet to inspect protection & editing
        $spreadsheet = IOFactory::load($fullPath);
        $sheet = $spreadsheet->getActiveSheet();

        // Must NOT be protected
        $this->assertFalse(
            $sheet->getProtection()->isProtectionEnabled(),
            'Worksheet protection must be false so users can edit cells normally in Excel.'
        );
        $this->assertNotTrue(
            $sheet->getProtection()->getSheet(),
            'Worksheet protection getSheet() must not be true.'
        );

        // Verify data exists
        $this->assertEquals('PERFORMANCE LOG', $sheet->getCell('A1')->getValue());

        // Test editing cells and saving
        $sheet->setCellValue('A14', 'EDITED Maria Santos Note');
        $sheet->setCellValue('D14', '₱12,000.00');

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save($fullPath);

        // Reopen to confirm edits persist and file remains valid
        $reopenedSpreadsheet = IOFactory::load($fullPath);
        $reopenedSheet = $reopenedSpreadsheet->getActiveSheet();

        $this->assertEquals('EDITED Maria Santos Note', $reopenedSheet->getCell('A14')->getValue());
        $this->assertEquals('₱12,000.00', $reopenedSheet->getCell('D14')->getValue());
        $this->assertFalse($reopenedSheet->getProtection()->isProtectionEnabled());

        // Cleanup
        @unlink($fullPath);
    }

    /**
     * TEST 2: Controller endpoint export-excel generates valid xlsx download.
     */
    public function test_controller_export_excel_endpoint_delivers_valid_xlsx(): void
    {
        $token = 'test_token_' . uniqid();
        Cache::put('report_export_' . $token, [
            'reportName' => 'Performance Log',
            'branch'     => 'Victoria Branch',
            'dateRange'  => 'Today',
            'columns'    => [
                ['title' => 'Rider Name', 'key' => 'rider'],
                ['title' => 'Deliveries', 'key' => 'deliveries'],
            ],
            'rows'       => [
                ['rider' => 'Flash Rider', 'deliveries' => 15],
            ],
        ], 60);

        $response = $this->actingAs($this->admin)->get('/reports/excel?token=' . $token);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    /**
     * TEST 3: Empty logs are handled safely without corruption.
     */
    public function test_empty_performance_log_exports_safely_and_editable(): void
    {
        $payload = [
            'reportName' => 'Empty Performance Log',
            'columns'    => [
                ['title' => 'Employee', 'key' => 'employee'],
                ['title' => 'Score', 'key' => 'score'],
            ],
            'rows'       => [],
        ];

        $exportFileName = 'test_empty_export_' . uniqid() . '.xlsx';
        Excel::store(new DynamicExport($payload), $exportFileName);
        $fullPath = \Illuminate\Support\Facades\Storage::path($exportFileName);

        $spreadsheet = IOFactory::load($fullPath);
        $sheet = $spreadsheet->getActiveSheet();

        $this->assertFalse($sheet->getProtection()->isProtectionEnabled());
        $this->assertEquals('EMPTY PERFORMANCE LOG', $sheet->getCell('A1')->getValue());

        // Cleanup
        @unlink($fullPath);
    }
}
