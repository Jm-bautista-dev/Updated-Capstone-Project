<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sales_imports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('uploaded_by');
            $table->string('file_name');
            $table->string('import_mode'); // add_new, update, replace_range, replace_all
            $table->integer('records_imported')->default(0);
            $table->integer('records_updated')->default(0);
            $table->integer('records_skipped')->default(0);
            $table->string('status'); // success, failed, rolled_back
            $table->timestamps();

            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('sales_import_audits', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('ip_address')->nullable();
            $table->string('action'); // upload, delete, restore, rollback
            $table->text('details');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('sales_backups', function (Blueprint $table) {
            $table->id();
            $table->string('backup_name');
            $table->string('file_path');
            $table->integer('records_count')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_backups');
        Schema::dropIfExists('sales_import_audits');
        Schema::dropIfExists('sales_imports');
    }
};
