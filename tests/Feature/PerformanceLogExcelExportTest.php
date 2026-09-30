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
    protected User $cashier;
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

        $this->cashier = User::factory()->create([
            'name'      => 'Maria Cashier',
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);
    }

    /**
     * TEST 1: Performance Log Excel file generates a protected worksheet against accidental editing.
     */
    public function test_performance_log_excel_export_is_protected_against_accidental_editing(): void
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

        // Load through PhpSpreadsheet to inspect protection & structure
        $spreadsheet = IOFactory::load($fullPath);
        $sheet = $spreadsheet->getActiveSheet();

        // Must be protected
        $this->assertTrue(
            $sheet->getProtection()->isProtectionEnabled(),
            'Worksheet protection must be enabled to prevent accidental edits.'
        );
        $this->assertTrue(
            $sheet->getProtection()->getSheet(),
            'Worksheet protection getSheet() must be true.'
        );

        // Selection must be enabled for readability & copying
        $this->assertTrue(
            $sheet->getProtection()->getSelectLockedCells(),
            'Users must be able to select locked cells for viewing and analysis.'
        );
        $this->assertTrue(
            $sheet->getProtection()->getSelectUnlockedCells(),
            'Users must be able to select unlocked cells.'
        );

        // AutoFilter and Sorting permitted for exploration
        $this->assertTrue(
            $sheet->getProtection()->getAutoFilter(),
            'AutoFilter must remain usable under protection.'
        );
        $this->assertTrue(
            $sheet->getProtection()->getSort(),
            'Sorting must remain usable under protection.'
        );

        // Destructive modifications blocked
        $this->assertFalse($sheet->getProtection()->getInsertRows(), 'Inserting rows must be blocked.');
        $this->assertFalse($sheet->getProtection()->getInsertColumns(), 'Inserting columns must be blocked.');
        $this->assertFalse($sheet->getProtection()->getDeleteRows(), 'Deleting rows must be blocked.');
        $this->assertFalse($sheet->getProtection()->getDeleteColumns(), 'Deleting columns must be blocked.');
        $this->assertFalse($sheet->getProtection()->getFormatCells(), 'Formatting cells must be blocked.');

        // Workbook structure protection
        $this->assertTrue(
            $spreadsheet->getSecurity()->getLockStructure(),
            'Workbook structure lock must be active.'
        );

        // Verify data contents exist and are correct
        $this->assertEquals('PERFORMANCE LOG', $sheet->getCell('A1')->getValue());
        $this->assertEquals('Company Name:', $sheet->getCell('A2')->getValue());
        $this->assertEquals('Maki Desu Operations Console', $sheet->getCell('B2')->getValue());
        $this->assertEquals('Victoria Branch', $sheet->getCell('B3')->getValue());

        // Cleanup
        @unlink($fullPath);
    }

    /**
     * TEST 2: Controller endpoint export-excel generates valid protected xlsx download.
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
     * TEST 3: Multiple date ranges export correctly with worksheet protection.
     */
    public function test_multiple_date_ranges_export_with_protection(): void
    {
        $ranges = [
            'Today' => '2026-09-09 to 2026-09-09',
            'Last 7 Days' => '2026-09-02 to 2026-09-09',
            'Last 30 Days' => '2026-08-10 to 2026-09-09',
            'Year to Date' => '2026-01-01 to 2026-09-09',
        ];

        foreach ($ranges as $label => $range) {
            $payload = [
                'reportName' => "Performance Log ({$label})",
                'branch'     => 'Victoria Branch',
                'dateRange'  => $range,
                'columns'    => [
                    ['title' => 'Staff Member', 'key' => 'staff'],
                    ['title' => 'Score', 'key' => 'score'],
                ],
                'rows'       => [
                    ['staff' => 'Maria Cashier', 'score' => 98],
                ],
            ];

            $exportFileName = 'test_range_export_' . uniqid() . '.xlsx';
            Excel::store(new DynamicExport($payload), $exportFileName);
            $fullPath = \Illuminate\Support\Facades\Storage::path($exportFileName);

            $spreadsheet = IOFactory::load($fullPath);
            $sheet = $spreadsheet->getActiveSheet();

            $this->assertTrue($sheet->getProtection()->isProtectionEnabled());
            $this->assertEquals(strtoupper("Performance Log ({$label})"), $sheet->getCell('A1')->getValue());
            $this->assertEquals($range, $sheet->getCell('B4')->getValue());

            @unlink($fullPath);
        }
    }

    /**
     * TEST 4: Empty logs are handled safely and remain protected.
     */
    public function test_empty_performance_log_exports_safely_and_protected(): void
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

        $this->assertTrue($sheet->getProtection()->isProtectionEnabled());
        $this->assertEquals('EMPTY PERFORMANCE LOG', $sheet->getCell('A1')->getValue());

        // Cleanup
        @unlink($fullPath);
    }

    /**
     * TEST 5: Unauthorized guest cannot access report export endpoint.
     */
    public function test_unauthenticated_user_cannot_access_export_excel(): void
    {
        $response = $this->get('/reports/excel?token=non_existent');
        $response->assertRedirect('/login');
    }
}
