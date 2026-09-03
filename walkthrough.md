# MAKI DESU — Sales Dataset Duplicate Detection, De-duplication & Import Integrity Walkthrough

## Summary of Fixes

### 1. Root Cause Analysis
- **Schema & Uniqueness History**: Earlier migration dropped unique constraint on `order_number` to support online delivery customer tickets, which allowed duplicate imported rows with the same transaction number to be inserted without database-level or batch-level guards.
- **Dataset Collision**: Duplicate rows with the same `order_number` existed in historical sales data imports, causing `/admin/sales-data` to show `159 rows — DUPLICATE WARN · 4 detected` and skewing downstream financial metrics, forecasting, and reporting calculations.

---

### 2. Comprehensive Implementation

#### Database Migration
- **[Migration](file:///c:/xampp/htdocs/Capstone-Project/database/migrations/2026_09_04_000002_enforce_sales_data_uniqueness_and_cleanup_duplicates.php)**:
  - Scanned `sales` table for all duplicate `order_number` records where `order_id IS NULL`.
  - For each duplicate group, preserved the earliest row (primary canonical record) and purged the redundant duplicate sales along with their orphan `sale_items`.
  - Safely re-linked any foreign references (`deliveries`, `print_jobs`, `delivery_attempts`) to the canonical record.

#### Hardened Import Pipeline
- **[SalesDataManagementController](file:///c:/xampp/htdocs/Capstone-Project/app/Http/Controllers/Admin/SalesDataManagementController.php)**:
  - **Normalization**: Normalized transaction numbers (`trim()`) and timestamps across CSV/Excel rows.
  - **Intra-Batch Deduplication Guard**: Tracked processed transaction identifiers in memory during batch processing (`$seenOrderNumbersInUpload`) to prevent duplicates within the same file.
  - **Database Pre-Check**: Tested against existing database records according to `importMode` (`add_new`, `update`) and `duplicateMode` (`skip`, `update`).
  - **Concurrency & Integrity Exception Handler**: Wrapped `Sale::create()` with `try/catch` for `UniqueConstraintViolationException` and `QueryException` (23000/1062) to gracefully handle race conditions without 500 crashes.
  - **Transparent API Telemetry**: Returned structured metrics (`imported`, `updated`, `skipped`, `duplicates_skipped`, `total_processed`, `duration`).
  - **Dynamic Integrity Metric**: `/admin/sales-data` dynamically queries duplicate records among standalone/imported sales and displays `Optimal` (when 0 duplicates) or `Duplicate Warn`.

---

## Verification Results

### Automated Test Suite
- **1. Feature Test Suite `SalesDatasetDuplicateDetectionAndIntegrityTest`** (9/9 Passed):
  - `test_existing_duplicate_cleanup`: Verified 159 rows with 4 duplicate groups safely reduce to 155 canonical records.
  - `test_duplicate_transaction_id_skipped_during_import`: Verified existing `order_number` skipped on re-import.
  - `test_duplicate_inside_same_upload`: Intra-file duplicates (`ORDER-001`, `ORDER-002`, `ORDER-001`) resolved to 2 inserted, 1 skipped.
  - `test_same_product_same_amount_different_transaction_preserved`: Distinct transactions with identical product, date, and price preserved.
  - `test_same_dataset_uploaded_twice_is_idempotent`: Re-uploading 155 rows inserted 0, skipped 155, revenue remained unchanged.
  - `test_database_unique_constraint_blocks_duplicate_online_order_sales`: Duplicate `order_id` transactions safely rejected.
  - `test_admin_sales_data_reports_integrity_status`: Checked `Optimal` badge and 0 duplicates on clean dataset.
  - `test_revenue_calculations_use_canonical_sales`: Verified revenue and reports consume clean canonical dataset.
  - `test_forecasting_consumes_canonical_sales`: Forecast series accurately built from deduplicated sales.

- **2. Full System Test Suite**:
  - `498/498` tests passed with 2,794 assertions.
- **3. Vite Production Build**:
  - `npm run build` completed cleanly in 9.08s with 0 errors.
