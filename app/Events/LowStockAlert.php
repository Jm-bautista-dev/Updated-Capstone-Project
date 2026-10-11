<?php

namespace App\Events;

use App\Models\IngredientStock;
use App\Utils\UnitConverter;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LowStockAlert implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $stockId;
    public int $ingredientId;
    public string $ingredientName;
    public float $currentStock;
    public string $currentStockFormatted;
    public float $threshold;
    public string $thresholdFormatted;
    public string $unit;
    public int $branchId;
    public string $branchName;
    public string $type; // 'low_stock' | 'out_of_stock'
    public string $url;
    public string $id;

    public function __construct(IngredientStock $stockRow, int $logId)
    {
        $stockRow->loadMissing(['ingredient', 'branch']);
        $ingredient = $stockRow->ingredient;
        $branch = $stockRow->branch;

        $displayUnit = strtolower(trim($ingredient->unit ?? 'pcs'));
        $displayStock = UnitConverter::convertFromBaseQuantity((float) $stockRow->stock, $displayUnit);
        $displayThreshold = UnitConverter::convertFromBaseQuantity((float) $stockRow->low_stock_level, $displayUnit);

        $this->stockId = (int) $stockRow->id;
        $this->ingredientId = (int) $stockRow->ingredient_id;
        $this->ingredientName = (string) ($ingredient->name ?? 'Ingredient');
        $this->currentStock = $displayStock;
        $this->currentStockFormatted = $displayStock . ' ' . $displayUnit;
        $this->threshold = $displayThreshold;
        $this->thresholdFormatted = $displayThreshold . ' ' . $displayUnit;
        $this->unit = $displayUnit;
        $this->branchId = (int) $stockRow->branch_id;
        $this->branchName = (string) ($branch->name ?? 'Branch');
        $this->type = (float) $stockRow->stock <= 0 ? 'out_of_stock' : 'low_stock';
        $this->url = '/inventory';
        $this->id = 'log_' . $logId;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("branch.{$this->branchId}"),
            new PrivateChannel("admin.orders"),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'LowStockAlert';
    }

    /**
     * Data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id'                     => $this->id,
            'stock_id'               => $this->stockId,
            'ingredient_id'          => $this->ingredientId,
            'ingredient_name'        => $this->ingredientName,
            'current_stock'          => $this->currentStockFormatted,
            'threshold'              => $this->thresholdFormatted,
            'remaining'              => $this->currentStockFormatted,
            'quantity_change'        => 'Min: ' . $this->thresholdFormatted,
            'unit'                   => $this->unit,
            'branch_id'              => $this->branchId,
            'branch_name'            => $this->branchName,
            'type'                   => $this->type,
            'url'                    => $this->url,
            'is_unread'              => true,
            'created_at'             => now()->toIso8601String(),
        ];
    }
}
