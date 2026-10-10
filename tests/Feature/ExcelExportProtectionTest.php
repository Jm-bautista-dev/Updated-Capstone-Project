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

    public function test_exported_xlsx_file_persists_protection_and_can_be_reopened()
    {
        $branch = Branch::create(['name' => 'Alaminos Branch']);
        $admin = User::factory()->create([
            'role' => 'admin',
            'branch_id' => $branch->id,
        ]);

        Sale::create([
            'order_number' => 'POS-1001',
            'user_id' => $admin->id,
            'branch_id' => $branch->id,
            'subtotal' => 350.00,
            'total' => 350.00,
            'paid_amount' => 350.00,
            'payment_method' => 'cash',
            'status' => 'completed',
        ]);

        $this->actingAs($admin);

        $export = new SalesExport(['branch_id' => $branch->id]);
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Populate headings and mapped rows
        $headings = $export->headings();
        $sheet->fromArray([$headings], null, 'A1');

        $rows = [];
        foreach ($export->collection() as $sale) {
            $rows[] = $export->map($sale);
        }
        if (!empty($rows)) {
            $sheet->fromArray($rows, null, 'A2');
        }

        $export->styles($sheet);

        $tempFile = tempnam(sys_get_temp_dir(), 'sales_export_test_') . '.xlsx';

        try {
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $writer->save($tempFile);

            $this->assertFileExists($tempFile);
            $this->assertGreaterThan(0, filesize($tempFile));

            // Reload file from disk as Excel would
            $loadedSpreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($tempFile);
            $loadedSheet = $loadedSpreadsheet->getActiveSheet();
            $protection = $loadedSheet->getProtection();

            // Verify worksheet protection persists across file serialization
            $this->assertTrue($protection->getSheet(), 'Loaded sheet protection must be enabled');
            $this->assertTrue($protection->getSelectLockedCells(), 'Users must be able to select locked cells for viewing/copying');
            $this->assertTrue($protection->getSelectUnlockedCells(), 'Users must be able to select unlocked cells');
            $this->assertTrue($protection->getAutoFilter(), 'AutoFilter must be permitted under protection in serialized file');
            $this->assertTrue($protection->getSort(), 'Sorting permission flag must be active');
            $this->assertFalse($protection->getInsertRows(), 'Inserting rows must be blocked');
            $this->assertFalse($protection->getDeleteRows(), 'Deleting rows must be blocked');
            $this->assertFalse($protection->getFormatCells(), 'Formatting cells must be blocked');

            // Verify workbook structure lock persists
            $this->assertTrue($loadedSpreadsheet->getSecurity()->getLockStructure(), 'Workbook structure lock must persist');

            // Verify auto-filter range is present and valid
            $this->assertNotEmpty($loadedSheet->getAutoFilter()->getRange(), 'AutoFilter range must be set on the exported sheet');
        } finally {
            if (file_exists($tempFile)) {
                @unlink($tempFile);
            }
        }
    }

    public function test_multi_sheet_workbook_protects_all_sheets_consistently()
    {
        $branch = Branch::create(['name' => 'Lingayen Branch']);
        $admin = User::factory()->create([
            'role' => 'admin',
            'branch_id' => $branch->id,
        ]);

        $this->actingAs($admin);

        $export = new SalesExport(['branch_id' => $branch->id]);
        $spreadsheet = new Spreadsheet();
        $sheet1 = $spreadsheet->getActiveSheet();
        $sheet1->setTitle('Sales Data');
        $sheet2 = $spreadsheet->createSheet();
        $sheet2->setTitle('Audit Summary');

        $export->styles($sheet1);

        // Verify Sheet 1
        $this->assertTrue($sheet1->getProtection()->getSheet(), 'Sheet 1 protection must be enabled');
        $this->assertTrue($sheet1->getProtection()->getSelectLockedCells(), 'Sheet 1 select locked cells allowed');
        $this->assertFalse($sheet1->getProtection()->getInsertRows(), 'Sheet 1 insert rows blocked');

        // Verify Sheet 2 (multi-sheet consistency)
        $this->assertTrue($sheet2->getProtection()->getSheet(), 'Sheet 2 protection must be enabled consistently');
        $this->assertTrue($sheet2->getProtection()->getSelectLockedCells(), 'Sheet 2 select locked cells allowed');
        $this->assertFalse($sheet2->getProtection()->getInsertRows(), 'Sheet 2 insert rows blocked');

        // Verify workbook structure security
        $this->assertTrue($spreadsheet->getSecurity()->getLockStructure(), 'Workbook structure lock must be enabled');
    }
}
