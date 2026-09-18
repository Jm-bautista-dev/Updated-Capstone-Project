<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class PrintBridge extends Model
{
    use HasFactory;

    public const STATUS_ONLINE   = 'online';
    public const STATUS_OFFLINE  = 'offline';
    public const STATUS_PRINTING = 'printing';

    public const TYPE_ANDROID = 'android';
    public const TYPE_WINDOWS = 'windows';
    public const TYPE_NETWORK = 'network';

    public const CONN_BT_SPP = 'bluetooth_spp';
    public const CONN_BT_BLE = 'bluetooth_ble';
    public const CONN_USB    = 'usb';
    public const CONN_TCP    = 'tcp';

    protected $fillable = [
        'bridge_uuid',
        'name',
        'branch_id',
        'terminal_id',
        'device_type',
        'paired_printer_name',
        'paired_printer_address',
        'connection_type',
        'status',
        'battery_level',
        'api_token',
        'last_heartbeat_at',
    ];

    protected $casts = [
        'battery_level'     => 'integer',
        'last_heartbeat_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (PrintBridge $bridge): void {
            if (empty($bridge->bridge_uuid)) {
                $branch = Branch::find($bridge->branch_id);
                $branchPrefix = $branch ? Str::slug($branch->name, '-') : 'bridge';
                $term = $bridge->terminal_id ?: 'pos-01';
                $bridge->bridge_uuid = strtoupper("{$branchPrefix}-{$term}-" . Str::random(6));
            }
            if (empty($bridge->api_token)) {
                $bridge->api_token = hash('sha256', Str::random(40));
            }
        });
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function claimedJobs(): HasMany
    {
        return $this->hasMany(PrintJob::class, 'claimed_by_bridge_id');
    }

    public function isOnline(): bool
    {
        if (!$this->last_heartbeat_at) {
            return false;
        }
        // Consider online if heartbeat seen within last 90 seconds
        return $this->last_heartbeat_at->greaterThan(now()->subSeconds(90));
    }

    public function recordHeartbeat(?int $batteryLevel = null, ?string $status = null): void
    {
        $updates = [
            'last_heartbeat_at' => now(),
            'status'            => $status ?: self::STATUS_ONLINE,
        ];
        if ($batteryLevel !== null) {
            $updates['battery_level'] = $batteryLevel;
        }
        $this->update($updates);
    }
}
