<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Utils\ImageHelper;

class CleanOrphanedImagesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:clean-orphaned-images
                            {--dry-run : List orphaned files without deleting them}
                            {--force : Force deletion without confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scan storage and public mirrors for orphaned image files not referenced by active database records and safely clean them.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Scanning database for active image references...');

        $referencedImages = $this->getReferencedImages();
        $this->info("Found " . count($referencedImages) . " active image references in database.");

        $directoriesToScan = ['products', 'categories', 'receipts', 'delivery-proofs', 'proof_of_delivery'];
        $orphanedFiles = [];

        foreach ($directoriesToScan as $dir) {
            $orphanedFiles = array_merge($orphanedFiles, $this->scanDirectory($dir, $referencedImages));
        }

        $orphanedFiles = array_unique($orphanedFiles);

        if (empty($orphanedFiles)) {
            $this->info('✅ No orphaned images found. Storage is clean!');
            return Command::SUCCESS;
        }

        $this->warn('Found ' . count($orphanedFiles) . ' orphaned image file(s):');
        foreach ($orphanedFiles as $file) {
            $this->line(' - ' . $file);
        }

        if ($this->option('dry-run')) {
            $this->info('Dry run completed. No files were deleted.');
            return Command::SUCCESS;
        }

        if (!$this->option('force') && !$this->confirm('Do you want to delete these orphaned files from all storage disks and public mirrors?')) {
            $this->info('Operation cancelled.');
            return Command::SUCCESS;
        }

        $deletedCount = 0;
        foreach ($orphanedFiles as $file) {
            ImageHelper::deleteImageFile($file);
            $deletedCount++;
        }

        $this->info("✅ Successfully deleted {$deletedCount} orphaned image file(s) across all storage and mirror destinations.");
        return Command::SUCCESS;
    }

    /**
     * Gather all active image paths from database tables.
     */
    protected function getReferencedImages(): array
    {
        $images = [];

        // 1. Products
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'image_path')) {
            $productImages = DB::table('products')->whereNotNull('image_path')->pluck('image_path')->toArray();
            $images = array_merge($images, $productImages);
        }

        // 2. Categories
        if (Schema::hasTable('categories') && Schema::hasColumn('categories', 'image_path')) {
            $categoryImages = DB::table('categories')->whereNotNull('image_path')->pluck('image_path')->toArray();
            $images = array_merge($images, $categoryImages);
        }

        // 3. Order Items (historical snapshot)
        if (Schema::hasTable('order_items') && Schema::hasColumn('order_items', 'image_path')) {
            $orderItemImages = DB::table('order_items')->whereNotNull('image_path')->pluck('image_path')->toArray();
            $images = array_merge($images, $orderItemImages);
        }

        // 4. Delivery attempts
        if (Schema::hasTable('delivery_attempts') && Schema::hasColumn('delivery_attempts', 'proof_image_path')) {
            $proofImages = DB::table('delivery_attempts')->whereNotNull('proof_image_path')->pluck('proof_image_path')->toArray();
            $images = array_merge($images, $proofImages);
        }

        // Normalize all paths (lowercase forward slashes, strip leading slashes)
        $normalized = [];
        foreach ($images as $img) {
            if (!$img || !is_string($img)) continue;
            $clean = ltrim(str_replace('\\', '/', trim($img)), '/');
            if (str_starts_with($clean, 'storage/')) {
                $clean = substr($clean, 8);
            } elseif (str_starts_with($clean, 'public/')) {
                $clean = substr($clean, 7);
            }
            $clean = ltrim($clean, '/');
            if ($clean !== '') {
                $normalized[$clean] = true;
                $normalized[basename($clean)] = true;
            }
        }

        return $normalized;
    }

    /**
     * Scan disk directories for files not present in the referenced list.
     */
    protected function scanDirectory(string $subDir, array $referencedImages): array
    {
        $orphaned = [];

        // 1. Scan Laravel public disk (supports test fakes, S3, and standard local storage)
        try {
            if (\Illuminate\Support\Facades\Storage::disk('public')->exists($subDir)) {
                $diskFiles = \Illuminate\Support\Facades\Storage::disk('public')->files($subDir);
                foreach ($diskFiles as $filePath) {
                    $base = basename($filePath);
                    if ($base === '.gitignore') continue;
                    if (!isset($referencedImages[$filePath]) && !isset($referencedImages[$base])) {
                        $orphaned[] = $filePath;
                    }
                }
            }
        } catch (\Throwable $e) {
            // Non-fatal if disk is unconfigured
        }

        // 2. Scan physical paths
        $scanPaths = [
            storage_path('app/public/' . $subDir),
            public_path('storage/' . $subDir),
            base_path('storage/' . $subDir),
            base_path('public_html/storage/' . $subDir),
        ];

        foreach ($scanPaths as $folder) {
            if (!is_dir($folder)) continue;

            $files = scandir($folder);
            foreach ($files as $file) {
                if ($file === '.' || $file === '..' || $file === '.gitignore') continue;

                $fullPath = $folder . '/' . $file;
                if (!is_file($fullPath)) continue;

                $relativePath = $subDir . '/' . $file;

                // Check if referenced
                if (!isset($referencedImages[$relativePath]) && !isset($referencedImages[$file])) {
                    $orphaned[] = $relativePath;
                }
            }
        }

        return array_unique($orphaned);
    }
}
