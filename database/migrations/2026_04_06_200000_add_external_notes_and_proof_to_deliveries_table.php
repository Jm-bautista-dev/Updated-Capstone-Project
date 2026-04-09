<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->text('external_notes')->nullable()->after('delivery_notes');
            $table->string('proof_of_delivery')->nullable()->after('external_notes');
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropColumn(['external_notes', 'proof_of_delivery']);
        });
    }
};
