<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'group',
        'type',
        'description',
        'updated_by',
    ];

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get setting value by key with caching.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = Cache::remember("sys_setting_{$key}", 300, function () use ($key) {
            return static::where('key', $key)->first();
        });

        if (!$setting) {
            return $default;
        }

        return match ($setting->type) {
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'json'    => json_decode($setting->value, true) ?? $default,
            'integer' => (int) $setting->value,
            default   => $setting->value ?? $default,
        };
    }

    /**
     * Set a setting value by key and forget cache.
     */
    public static function set(string $key, mixed $value, string $group = 'general', ?string $type = null, ?string $description = null, ?int $userId = null): static
    {
        $type = $type ?? (is_bool($value) ? 'boolean' : (is_array($value) ? 'json' : (is_int($value) ? 'integer' : 'string')));
        $rawValue = is_array($value) ? json_encode($value) : (is_bool($value) ? ($value ? 'true' : 'false') : (string) $value);

        $setting = static::updateOrCreate(
            ['key' => $key],
            [
                'value'       => $rawValue,
                'group'       => $group,
                'type'        => $type,
                'description' => $description,
                'updated_by'  => $userId,
            ]
        );

        Cache::forget("sys_setting_{$key}");

        return $setting;
    }
}
