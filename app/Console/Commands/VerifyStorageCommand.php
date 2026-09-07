<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Console\Command\Command as SymfonyCommand;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class VerifyStorageCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:verify
                            {--fix : Automatically create missing directories and repair symlink}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify persistent storage integrity, directory permissions, symlink, and active image availability.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('====================================================');
        $this->info('  Maki Desu Storage & Deployment Integrity Check  ');
        $this->info('====================================================');

        $hasError = false;
        $shouldFix = $this->option('fix');

        // 1. Check storage/app/public directory
        $storageAppPublic = storage_path('app/public');
        if (!is_dir($storageAppPublic)) {
            $this->error("❌ Base public storage path is missing: {$storageAppPublic}");
            if ($shouldFix) {
                @mkdir($storageAppPublic, 0775, true);
                $this->info("   -> Created directory {$storageAppPublic}");
            } else {
                $hasError = true;
            }
        } else {
            $this->info("✅ Base storage directory exists: {$storageAppPublic}");
        }

        // 2. Check and ensure standard upload directories
        $subDirs = ['products', 'categories', 'delivery-proofs', 'proof_of_delivery', 'receipts', 'reviews'];
        foreach ($subDirs as $dir) {
            $path = $storageAppPublic . '/' . $dir;
            if (!is_dir($path)) {
                if ($shouldFix) {
                    @mkdir($path, 0775, true);
                    $this->info("   -> Created missing subfolder: {$dir}");
                } else {
                    $this->warn("⚠️  Subfolder missing: storage/app/public/{$dir}");
                }
            } else {
                if (!is_writable($path)) {
                    $this->warn("⚠️  Directory not writable: storage/app/public/{$dir}");
                } else {
                    $this->line("   ✓ Subfolder ready: {$dir}");
                }
            }
        }

        // 3. Check public/storage symlink
        $publicStorage = public_path('storage');
        $symlinkValid = false;

        $realExpected = realpath($storageAppPublic);
        $realPublicStorage = realpath($publicStorage);

        if (is_link($publicStorage)) {
            $target = readlink($publicStorage);
            if ($realPublicStorage && $realExpected && $realPublicStorage === $realExpected) {
                $symlinkValid = true;
                $this->info("✅ Symlink public/storage -> {$target} is VALID and points to expected storage directory.");
            } else {
                $this->error("❌ Symlink public/storage exists but points to incorrect target: {$target}");
            }
        } elseif (file_exists($publicStorage) && $realPublicStorage && $realExpected && $realPublicStorage === $realExpected) {
            $symlinkValid = true;
            $this->info("✅ Link/Junction public/storage points directly to persistent storage.");
        } elseif (file_exists($publicStorage) && is_dir($publicStorage)) {
            $this->warn("⚠️  public/storage exists as a separate directory instead of pointing to storage/app/public.");
        } else {
            $this->error("❌ public/storage does NOT exist.");
        }

        if (!$symlinkValid && $shouldFix) {
            $this->info('   -> Attempting to repair public/storage symlink...');
            $this->call('storage:link');
        }

        // 4. Verify Active Database Images
        $this->info('');
        $this->info('--- Checking Database Image Records vs Physical Files ---');

        $activeProductCount = 0;
        $foundImageCount = 0;
        $missingImageCount = 0;

        try {
            if (Schema::hasTable('products') && Schema::hasColumn('products', 'image_path')) {
                $products = DB::table('products')->whereNotNull('image_path')->select('id', 'name', 'image_path')->get();
                $activeProductCount = $products->count();

                foreach ($products as $prod) {
                    $rawPath = trim($prod->image_path);
                    $exists = Storage::disk('public')->exists($rawPath) ||
                              file_exists(storage_path('app/public/' . $rawPath)) ||
                              file_exists(public_path('storage/' . $rawPath));

                    if ($exists) {
                        $foundImageCount++;
                    } else {
                        $missingImageCount++;
                        $this->warn("   ⚠️  Product #{$prod->id} ({$prod->name}): File missing for '{$rawPath}'");
                    }
                }
            }
            $this->info("Products checked: {$activeProductCount} | Found: {$foundImageCount} | Missing: {$missingImageCount}");
        } catch (\Throwable $e) {
            $this->warn("⚠️  Database check skipped: " . $e->getMessage());
        }

        if ($hasError) {
            $this->error('❌ Storage verification failed with errors. Run with --fix to repair.');
            return SymfonyCommand::FAILURE;
        }

        $this->info('✅ Persistent Storage Verification PASSED successfully.');
        return SymfonyCommand::SUCCESS;
    }
}
