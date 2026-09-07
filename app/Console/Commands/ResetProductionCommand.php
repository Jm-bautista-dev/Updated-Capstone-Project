<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Console\Command\Command as SymfonyCommand;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;

class ResetProductionCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:reset-production
                            {--force : Force reset without confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform a complete, clean reset of the production database, storage, and caches for a fresh client deployment.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->alert('FRESH PRODUCTION RESET: All test data, old orders, old customers, and old uploads will be wiped.');

        if (!$this->option('force') && !$this->confirm('Are you ABSOLUTELY sure you want to perform a fresh production reset?')) {
            $this->info('Reset aborted.');
            return SymfonyCommand::SUCCESS;
        }

        $this->info('--- 1. Resetting Database Tables Cleanly ---');
        
        // Disable foreign keys and drop all existing tables
        Schema::disableForeignKeyConstraints();
        $tables = DB::select('SHOW TABLES');
        $dbName = DB::getDatabaseName();
        $tableKey = 'Tables_in_' . $dbName;

        $droppedCount = 0;
        foreach ($tables as $table) {
            $tableName = $table->$tableKey ?? array_values((array) $table)[0] ?? null;
            if ($tableName) {
                Schema::dropIfExists($tableName);
                $droppedCount++;
            }
        }
        Schema::enableForeignKeyConstraints();
        $this->info("   ✓ Dropped {$droppedCount} existing tables.");

        // Run migrations fresh
        $this->info('--- 2. Running Fresh Migrations ---');
        Artisan::call('migrate', ['--force' => true], $this->getOutput());

        // Run required seeders
        $this->info('--- 3. Running Official Database Seeders ---');
        Artisan::call('db:seed', ['--force' => true], $this->getOutput());

        // Clean old storage uploads
        $this->info('--- 4. Cleaning Storage & Ensuring Directory Structure ---');
        $storageAppPublic = storage_path('app/public');
        $preservedFiles = [
            'products/KFa94aeoc6u2uNtrtJWut6OBEwcPK1NPzhPLSBIB.webp',
            'products/UuQgPx8vEmB4XZYLHr222EIwftUsZC9zo23bhklw.webp',
            'products/i31yyCKTEeGIXK5TcMSFloUfq1fvM6CV56oWT27l.webp',
            'products/jIb4tHWIVCvbZBVEnbN2QVK1uC3m4DvfAs9OYkIh.webp',
            'products/qiBrIy089cM72hsEIEloWRKlNoWTE6N6yVL8J568.webp',
            'products/vVqWLaP6Tme2blpPlg69o7mMv8uxWvJrh9VrKnOX.webp',
            'products/vvOZ06NJoGhT9R9709hd4HSqsVBhZaU2u2nmOFee.webp',
            'products/xzu04WKAWtNnkqjbtR93YbZtD4nq9TLp3M5aqzoC.jpg',
        ];

        $subDirs = ['products', 'categories', 'delivery-proofs', 'proof_of_delivery', 'receipts', 'reviews'];
        foreach ($subDirs as $dir) {
            $dirPath = $storageAppPublic . '/' . $dir;
            if (!is_dir($dirPath)) {
                @mkdir($dirPath, 0775, true);
            }

            // Remove non-preserved files from old uploads
            if ($dir !== 'products') {
                $files = glob($dirPath . '/*');
                foreach ($files as $file) {
                    if (is_file($file) && basename($file) !== '.gitignore') {
                        @unlink($file);
                    }
                }
            } else {
                $files = glob($dirPath . '/*');
                foreach ($files as $file) {
                    if (is_file($file) && basename($file) !== '.gitignore') {
                        $rel = 'products/' . basename($file);
                        if (!in_array($rel, $preservedFiles, true)) {
                            @unlink($file);
                        }
                    }
                }
            }
        }
        $this->info('   ✓ Storage directories ready and old test uploads cleaned.');

        // Recreate storage symlink
        $this->info('--- 5. Verifying & Linking Public Storage ---');
        Artisan::call('storage:link', [], $this->getOutput());

        // Clear and rebuild caches
        $this->info('--- 6. Rebuilding Application Optimization Caches ---');
        Artisan::call('optimize:clear', [], $this->getOutput());
        Artisan::call('config:cache', [], $this->getOutput());
        Artisan::call('route:cache', [], $this->getOutput());
        Artisan::call('view:cache', [], $this->getOutput());
        Artisan::call('optimize', [], $this->getOutput());

        // Run storage verification
        $this->info('--- 7. Running Final Storage & Database Verification ---');
        Artisan::call('storage:verify', ['--fix' => true], $this->getOutput());

        $this->info('');
        $this->info('===========================================================');
        $this->info('  ✅ FRESH PRODUCTION RESET COMPLETED SUCCESSFULLY!        ');
        $this->info('===========================================================');
        $this->info('Admin Account: jmbautista0228@gmail.com');
        $this->info('Super Admin:   superadmin@makidesu');
        $this->info('Branches:      Maki Desu Victoria (ID: 1), Sta Cruz (ID: 2)');
        $this->info('Transactional tables (Orders, Customers, Reviews, Sales): EMPTY');
        $this->info('===========================================================');

        return SymfonyCommand::SUCCESS;
    }
}
