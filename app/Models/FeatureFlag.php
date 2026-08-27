<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class FeatureFlag extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'description',
        'is_enabled',
        'rules',
        'updated_by',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'rules'      => 'array',
    ];

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Check if a feature is enabled.
     */
    public static function isEnabled(string $key, bool $default = true): bool
    {
        return Cache::remember("feature_flag_{$key}", 300, function () use ($key, $default) {
            $flag = static::where('key', $key)->first();
            return $flag ? (bool) $flag->is_enabled : $default;
        });
    }

    /**
     * Toggle a feature flag.
     */
    public static function toggle(string $key, bool $enabled, ?int $userId = null): bool
    {
        $flag = static::where('key', $key)->first();
        if ($flag) {
            $flag->update([
                'is_enabled' => $enabled,
                'updated_by' => $userId,
            ]);
            Cache::forget("feature_flag_{$key}");
            return true;
        }
        return false;
    }
}
