<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Protection;

class ExcelProtectionService
{
    /**
     * Standard worksheet protection options.
     */
    public const DEFAULT_PERMISSIONS = [
        'selectLockedCells'   => true,
        'selectUnlockedCells' => true,
        'autoFilter'          => true,
        'sort'                => true,
        'formatCells'         => false,
        'insertRows'          => false,
        'insertColumns'       => false,
        'deleteRows'          => false,
        'deleteColumns'       => false,
        'objects'             => true,
        'scenarios'           => true,
    ];

    /**
     * Apply standardized worksheet protection and workbook structure protection.
     *
     * @param Worksheet $sheet Primary worksheet being exported
     * @param string|null $customPassword Optional protection password override
     * @param array $options Optional configuration overrides
     * @return void
     */
    public static function protect(Worksheet $sheet, ?string $customPassword = null, array $options = []): void
    {
        $highestColumn = $sheet->getHighestColumn();
        $highestRow = $sheet->getHighestRow();

        // 1. Explicitly lock all data and header cells on the primary sheet
        if ($highestRow >= 1) {
            $sheet->getStyle("A1:{$highestColumn}{$highestRow}")
                ->getProtection()
                ->setLocked(Protection::PROTECTION_PROTECTED);
        }

        // 2. Configure primary worksheet protection
        self::configureSheetProtection($sheet, $customPassword, $options);

        // 3. Ensure all sheets in the parent workbook have consistent protection applied
        try {
            $parent = $sheet->getParent();
            if ($parent) {
                foreach ($parent->getAllSheets() as $wkSheet) {
                    $wkHighestCol = $wkSheet->getHighestColumn();
                    $wkHighestRow = $wkSheet->getHighestRow();
                    if ($wkHighestRow >= 1) {
                        $wkSheet->getStyle("A1:{$wkHighestCol}{$wkHighestRow}")
                            ->getProtection()
                            ->setLocked(Protection::PROTECTION_PROTECTED);
                    }

                    self::configureSheetProtection($wkSheet, $customPassword, $options);
                }

                // 4. Lock workbook structure (blocks adding, deleting, renaming, moving sheets)
                if ($parent->getSecurity()) {
                    $parent->getSecurity()->setLockStructure(true);
                    $password = $customPassword ?? config('app.excel_export_password', 'MakiDesuSales');
                    if (!empty($password)) {
                        $parent->getSecurity()->setWorkbookPassword((string) $password);
                    }
                }
            }
        } catch (\Throwable $e) {
            // Safe fallback if workbook security is unsupported in current environment
        }
    }

    /**
     * Configure individual worksheet protection parameters.
     *
     * @param Worksheet $sheet
     * @param string|null $customPassword
     * @param array $options
     * @return void
     */
    public static function configureSheetProtection(Worksheet $sheet, ?string $customPassword = null, array $options = []): void
    {
        $perms = array_merge(self::DEFAULT_PERMISSIONS, $options);

        $protection = $sheet->getProtection();
        $protection->setSheet(true);

        // Permissions: view, select, print, filter, sort
        $protection->setSelectLockedCells($perms['selectLockedCells']);
        $protection->setSelectUnlockedCells($perms['selectUnlockedCells']);
        $protection->setAutoFilter($perms['autoFilter']);
        $protection->setSort($perms['sort']);

        // Block structural, insertion, and formatting edits
        $protection->setFormatCells($perms['formatCells']);
        $protection->setInsertRows($perms['insertRows']);
        $protection->setInsertColumns($perms['insertColumns']);
        $protection->setDeleteRows($perms['deleteRows']);
        $protection->setDeleteColumns($perms['deleteColumns']);
        $protection->setObjects($perms['objects']);
        $protection->setScenarios($perms['scenarios']);

        // Set protection password
        $password = $customPassword ?? config('app.excel_export_password', 'MakiDesuSales');
        if (!empty($password)) {
            $protection->setPassword((string) $password);
        }
    }
}
