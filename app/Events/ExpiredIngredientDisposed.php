<?php

namespace App\Events;

use App\Models\IngredientBatch;
use App\Models\Ingredient;
use App\Models\Branch;
use App\Utils\UnitConverter;
use Carbon\Carbon;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ExpiredIngredientDisposed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $id;
    public int $batchId;
    public string $batchCode;
    public int $ingredientId;
    public string $ingredientName;
    public float $disposedQuantity;
    public string $disposedQuantityFormatted;
    public string $unit;
    public int $branchId;
    public string $branchName;
    public string $expirationDate;
    public string $expirationDateFormatted;
    public string $disposalTimestamp;
    public string $disposalTimestampFormatted;
    public string $status;
    public array $affectedProducts;
    public string $type; // 'expired_ingredient'
    public string $url;
    public ?array $groupedItems;

    /**
     * Create a new event instance.
     *
     * @param IngredientBatch $batch
     * @param float $disposedBaseQuantity
     * @param array $affectedProducts Array of ['id' => int, 'name' => string, 'previous_servings' => float, 'recalculated_servings' => float]
     * @param Carbon|null $timestamp
     * @param array|null $groupedItems
     */
    public function __construct(
        IngredientBatch $batch,
        float $disposedBaseQuantity,
        array $affectedProducts = [],
        ?Carbon $timestamp = null,
        ?array $groupedItems = null
    ) {
        $tz = config('app.timezone', 'Asia/Manila');
        $now = $timestamp ? $timestamp->copy()->setTimezone($tz) : Carbon::now($tz);

        $batch->loadMissing(['ingredient', 'branch']);
        $ingredient = $batch->ingredient;
        $branch = $batch->branch;

        $displayUnit = strtolower(trim($batch->unit ?? $ingredient?->unit ?? 'pcs'));
        $displayDisposed = UnitConverter::convertFromBaseQuantity($disposedBaseQuantity, $displayUnit);

        $this->id = sprintf('exp_%d_%d_%d', $batch->id, $batch->branch_id, $now->timestamp);
        $this->batchId = (int) $batch->id;
        $this->batchCode = (string) $batch->batch_code;
        $this->ingredientId = (int) $batch->ingredient_id;
        $this->ingredientName = (string) ($ingredient?->name ?? 'Ingredient');
        $this->disposedQuantity = (float) $displayDisposed;
        $this->disposedQuantityFormatted = $displayDisposed . ' ' . $displayUnit;
        $this->unit = $displayUnit;
        $this->branchId = (int) $batch->branch_id;
        $this->branchName = (string) ($branch?->name ?? 'Branch');

        $expDate = $batch->expiration_date 
            ? $batch->expiration_date->copy()->setTimezone($tz) 
            : $now;
        $this->expirationDate = $expDate->format('Y-m-d');
        $this->expirationDateFormatted = $expDate->format('d F Y');

        $this->disposalTimestamp = $now->toIso8601String();
        $this->disposalTimestampFormatted = $now->format('M d, Y h:i A');
        $this->status = 'Removed from usable inventory.';
        $this->affectedProducts = $affectedProducts;
        $this->type = 'expired_ingredient';
        $this->url = "/inventory?branch_id={$this->branchId}&highlight={$this->ingredientId}";
        $this->groupedItems = $groupedItems;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("branch.{$this->branchId}"),
            new PrivateChannel("branch.{$this->branchId}.orders"),
            new PrivateChannel("admin.orders"),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'ExpiredIngredientDisposed';
    }

    /**
     * Data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id'                          => $this->id,
            'batch_id'                    => $this->batchId,
            'batch_code'                  => $this->batchCode,
            'ingredient_id'               => $this->ingredientId,
            'ingredient_name'             => $this->ingredientName,
            'disposed_quantity'           => $this->disposedQuantity,
            'disposed_quantity_formatted' => $this->disposedQuantityFormatted,
            'unit'                        => $this->unit,
            'branch_id'                   => $this->branchId,
            'branch_name'                 => $this->branchName,
            'expiration_date'             => $this->expirationDate,
            'expiration_date_formatted'   => $this->expirationDateFormatted,
            'disposal_timestamp'          => $this->disposalTimestamp,
            'disposal_timestamp_formatted'=> $this->disposalTimestampFormatted,
            'status'                      => $this->status,
            'affected_products'           => $this->affectedProducts,
            'grouped_items'               => $this->groupedItems,
            'type'                        => $this->type,
            'url'                         => $this->url,
        ];
    }
}

