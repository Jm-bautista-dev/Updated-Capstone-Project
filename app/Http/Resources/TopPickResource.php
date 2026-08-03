<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TopPickResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = is_array($this->resource) ? $this->resource : $this->resource->toArray();

        $imagePath = $data['image_path'] ?? null;
        $imageUrl = null;

        if ($imagePath) {
            $imageUrl = str_starts_with($imagePath, 'http')
                ? $imagePath
                : asset('storage/' . ltrim($imagePath, '/'));
        } else {
            // Default elegant placeholder URL for products without images
            $imageUrl = asset('images/product-placeholder.png');
        }

        return [
            'id'            => (int) ($data['id'] ?? 0),
            'name'          => (string) ($data['name'] ?? 'Product'),
            'sku'           => (string) ($data['sku'] ?? ''),
            'barcode'       => (string) ($data['barcode'] ?? ''),
            'category'      => (string) ($data['category'] ?? 'General'),
            'brand'         => (string) ($data['brand'] ?? config('app.name', 'MakiDesu')),
            'price'         => (float) round((float) ($data['price'] ?? 0), 2),
            'image'         => $imageUrl,
            'quantity_sold' => (int) ($data['quantity_sold'] ?? 0),
            'total_sales'   => (float) round((float) ($data['total_sales'] ?? 0), 2),
            'ranking'       => (int) ($data['ranking'] ?? 0),
            'forecast_trend'=> $data['forecast_trend'] ?? null,
        ];
    }
}
