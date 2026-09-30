<?php

namespace Tests\Feature;

use App\Exports\DynamicExport;
use App\Exports\SalesExport;
use App\Models\Branch;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Tests\TestCase;

class ExcelExportProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_dynamic_export_applies_sheet_and_workbook_protection()
    {
        $payload = [
            'reportName' => 'Sales Summary Audit',
            'branch' => 'Victoria Branch',
            'dateRange' => '2026-01-01 to 2026-01-31',
            'generatedBy' => 'Admin User',
            'columns' => [
                ['key' => 'order_number', 'title' => 'Order Number'],
                ['key' => 'total', 'title' => 'Total Amount (PHP)'],
            ],
            'rows' => [
                ['order_number' => 'ORD-101', 'total' => '500.00'],
                ['order_number' => 'ORD-102', 'total' => '750.00'],
            ],
            'kpis' => [
                ['title' => 'Total Revenue', 'value' => '1250.00'],
            ],
        ];

        $export = new DynamicExport($payload);
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Populate and style
        $data = $export->array();
        $sheet->fromArray($data);
        $export->styles($sheet);

        // Verify sheet protection is active
        $this->assertTrue($sheet->getProtection()->getSheet(), 'Worksheet protection must be enabled');
        $this->assertTrue($sheet->getProtection()->getSelectLockedCells(), 'Users must be able to select locked cells for viewing/copying');
        $this->assertTrue($sheet->getProtection()->getSelectUnlockedCells(), 'Users must be able to select unlocked cells');
        $this->assertTrue($sheet->getProtection()->getAutoFilter(), 'AutoFilter must be permitted under protection');
        $this->assertTrue($sheet->getProtection()->getSort(), 'Sorting must be permitted under protection');
        $this->assertFalse($sheet->getProtection()->getInsertRows(), 'Inserting rows must be blocked');
        $this->assertFalse($sheet->getProtection()->getDeleteRows(), 'Deleting rows must be blocked');
        $this->assertFalse($sheet->getProtection()->getFormatCells(), 'Formatting cells must be blocked');

        // Verify workbook structure protection
        $this->assertTrue($spreadsheet->getSecurity()->getLockStructure(), 'Workbook structure lock must be enabled');
    }

    public function test_sales_export_applies_sheet_and_workbook_protection()
    {
        $branch = Branch::create(['name' => 'Santa Cruz Branch']);
        $admin = User::factory()->create([
            'role' => 'admin',
            'branch_id' => $branch->id,
        ]);

        Sale::create([
            'order_number' => 'POS-999',
            'user_id' => $admin->id,
            'branch_id' => $branch->id,
            'subtotal' => 200.00,
            'total' => 200.00,
            'paid_amount' => 200.00,
            'payment_method' => 'cash',
            'status' => 'completed',
        ]);

        $this->actingAs($admin);

        $export = new SalesExport(['branch_id' => $branch->id]);
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $export->styles($sheet);

        $this->assertTrue($sheet->getProtection()->getSheet(), 'SalesExport worksheet protection must be enabled');
        $this->assertTrue($sheet->getProtection()->getSelectLockedCells(), 'Users must be able to select cells for viewing');
        $this->assertTrue($sheet->getProtection()->getAutoFilter(), 'AutoFilter must be permitted');
        $this->assertFalse($sheet->getProtection()->getInsertRows(), 'Inserting rows must be blocked');
        $this->assertFalse($sheet->getProtection()->getDeleteRows(), 'Deleting rows must be blocked');
        $this->assertTrue($spreadsheet->getSecurity()->getLockStructure(), 'Workbook structure lock must be enabled');
    }
}
