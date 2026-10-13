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
        // 1. Enhance forecast_benchmarks table with audit & candidate result columns
        Schema::table('forecast_benchmarks', function (Blueprint $table) {
            if (!Schema::hasColumn('forecast_benchmarks', 'status')) {
                $table->string('status', 32)->default('completed')->after('branch_id');
            }
            if (!Schema::hasColumn('forecast_benchmarks', 'selection_metric')) {
                $table->string('selection_metric', 32)->default('WAPE')->after('recommended_model');
            }
            if (!Schema::hasColumn('forecast_benchmarks', 'wape')) {
                $table->double('wape')->nullable()->after('mape');
            }
            if (!Schema::hasColumn('forecast_benchmarks', 'rankings_data')) {
                $table->longText('rankings_data')->nullable()->after('wape');
            }
            if (!Schema::hasColumn('forecast_benchmarks', 'validation_data')) {
                $table->longText('validation_data')->nullable()->after('rankings_data');
            }
            if (!Schema::hasColumn('forecast_benchmarks', 'dataset_start_date')) {
                $table->date('dataset_start_date')->nullable()->after('dataset_range');
            }
            if (!Schema::hasColumn('forecast_benchmarks', 'dataset_end_date')) {
                $table->date('dataset_end_date')->nullable()->after('dataset_start_date');
            }
            if (!Schema::hasColumn('forecast_benchmarks', 'total_days')) {
                $table->integer('total_days')->default(0)->after('dataset_end_date');
            }
            if (!Schema::hasColumn('forecast_benchmarks', 'experiment_number')) {
                $table->integer('experiment_number')->default(1)->after('total_days');
            }
            if (!Schema::hasColumn('forecast_benchmarks', 'error_message')) {
                $table->text('error_message')->nullable()->after('processing_time');
            }
        });

        // 2. Create forecast_models table (Durable Single-Model Registry & Lifecycle)
        if (!Schema::hasTable('forecast_models')) {
            Schema::create('forecast_models', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('branch_id')->nullable();
                $table->unsignedBigInteger('benchmark_id')->nullable();
                $table->string('model_name', 64);
                $table->integer('version')->default(1);
                $table->boolean('is_active')->default(true);
                $table->string('status', 32)->default('ready'); // 'training', 'ready', 'failed', 'archived'
                $table->string('dataset_range', 128)->nullable();
                $table->date('dataset_start_date')->nullable();
                $table->date('dataset_end_date')->nullable();
                $table->integer('training_points')->default(0);
                $table->string('selection_metric', 32)->default('WAPE');
                $table->longText('evaluation_metrics')->nullable(); // JSON: MAE, RMSE, MAPE, WAPE
                $table->longText('hyperparameters')->nullable();   // JSON: alpha, beta, gamma, phi, window
                $table->longText('fitted_parameters')->nullable(); // JSON: level, trend, seasonal indices, weights
                $table->timestamp('trained_at')->nullable();
                $table->unsignedBigInteger('trained_by')->nullable();
                $table->text('notes')->nullable();
                $table->text('error_message')->nullable();
                $table->timestamps();

                $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
                $table->foreign('benchmark_id')->references('id')->on('forecast_benchmarks')->onDelete('set null');
                $table->foreign('trained_by')->references('id')->on('users')->onDelete('set null');

                $table->index(['branch_id', 'is_active']);
                $table->index(['model_name', 'status']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('forecast_models');

        Schema::table('forecast_benchmarks', function (Blueprint $table) {
            $cols = [
                'status',
                'selection_metric',
                'wape',
                'rankings_data',
                'validation_data',
                'dataset_start_date',
                'dataset_end_date',
                'total_days',
                'experiment_number',
                'error_message',
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('forecast_benchmarks', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
