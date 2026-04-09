<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates supplier update requests.
 * Same rules as store but excludes current supplier from uniqueness checks.
 */
class UpdateSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $supplierId = $this->route('supplier')->id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('suppliers')->where(function ($query) {
                    return $query->where('branch_id', $this->input('branch_id'))
                                ->whereNull('deleted_at');
                })->ignore($supplierId),
            ],
            'contact_person' => 'required|string|max:255',
            'email'          => [
                'required',
                'email',
                'max:255',
                Rule::unique('suppliers', 'email')->ignore($supplierId),
            ],
            'phone'          => ['nullable', 'string', 'max:20', 'regex:/^[\+]?[0-9\s\-\(\)]{7,20}$/'],
            'address'        => 'nullable|string|max:500',
            'status'         => 'required|in:Active,Inactive',
            'branch_id'      => 'required|exists:branches,id',
            'ingredient_ids'   => 'nullable|array',
            'ingredient_ids.*' => 'exists:ingredients,id',
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique'           => 'A supplier with this name already exists in the selected branch.',
            'email.unique'          => 'This email address is already registered to another supplier.',
            'phone.regex'           => 'Please enter a valid phone number (e.g., +63 912 345 6789).',
            'branch_id.required'    => 'Please select a branch for this supplier.',
            'contact_person.required' => 'A contact person is required.',
        ];
    }
}
