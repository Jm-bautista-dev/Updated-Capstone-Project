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
        Schema::create('forecast_benchmarks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->string('dataset_range');
            $table->string('recommended_model');
            $table->double('mae')->default(0);
            $table->double('rmse')->default(0);
            $table->double('mape')->default(0);
            $table->double('processing_time')->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
        });

        Schema::create('forecast_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->string('model_used');
            $table->integer('horizon_days');
            $table->string('dataset_range');
            $table->longText('forecast_data'); // JSON representation of generated forecast series
            $table->double('mae')->default(0);
            $table->double('rmse')->default(0);
            $table->double('mape')->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('forecast_records');
        Schema::dropIfExists('forecast_benchmarks');
    }
};
