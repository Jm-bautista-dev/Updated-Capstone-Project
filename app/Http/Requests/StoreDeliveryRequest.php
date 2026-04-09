<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sale_id'          => 'required|exists:sales,id',
            'delivery_type'    => 'required|in:internal,external',
            'external_service' => 'required_if:delivery_type,external|nullable|in:grab,lalamove',
            'tracking_number'  => 'required_if:delivery_type,external|nullable|string|max:100',
            'rider_id'         => 'required_if:delivery_type,internal|nullable|exists:riders,id',
            'customer_name'    => 'required|string|max:255',
            'customer_phone'   => ['nullable', 'string', 'max:20', 'regex:/^[\+]?[0-9\s\-\(\)]{7,20}$/'],
            'customer_address' => 'required|string|max:500',
            'distance_km'      => ['required', 'numeric', 'gt:0', 'max:'.config('delivery.max_distance_km', 50)],
            'delivery_fee'     => 'required|numeric|min:0',
            'delivery_notes'   => 'nullable|string|max:500',
            'external_notes'   => 'nullable|string|max:1000',
            'proof_of_delivery'=> 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
        ];
    }

    public function messages(): array
    {
        return [
            'external_service.required_if' => 'Please select a delivery service (Grab or Lalamove).',
            'tracking_number.required_if'  => 'Tracking number is required for external deliveries.',
            'rider_id.required_if'         => 'Please assign a rider for internal deliveries.',
            'customer_name.required'       => 'Customer name is required.',
            'customer_address.required'    => 'Delivery address is required.',
            'delivery_fee.required'        => 'Delivery fee is required.',
        ];
    }
}
