<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Seeds static latitude/longitude/address for existing branches.
 *
 * Coordinates sourced from Google Maps (right-click → "What's here?").
 * These are fixed values — update manually if the physical location changes.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Sta. Cruz Branch ──────────────────────────────────────────────
        DB::table('branches')
            ->where('name', 'like', '%sta%cruz%')
            ->orWhere('name', 'like', '%santa%cruz%')
            ->update([
                'address'   => 'Sta. Cruz, Laguna, Philippines',
                'latitude'  => 14.2810000,
                'longitude' => 121.4160000,
            ]);

        // ── Victoria Branch ───────────────────────────────────────────────
        DB::table('branches')
            ->where('name', 'like', '%victoria%')
            ->update([
                'address'   => 'Victoria, Laguna, Philippines',
                'latitude'  => 14.2277000,
                'longitude' => 121.3299000,
            ]);
    }

    public function down(): void
    {
        DB::table('branches')->update([
            'address'   => null,
            'latitude'  => null,
            'longitude' => null,
        ]);
    }
};
