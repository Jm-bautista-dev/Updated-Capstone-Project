<?php

namespace App\Rules;

use App\Models\Ingredient;
use App\Services\InventoryExpirationService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class UnexpiredExpirationDate implements ValidationRule
{
    protected ?Ingredient $ingredient;
    protected ?string $expirationType;

    public function __construct(?Ingredient $ingredient = null, ?string $expirationType = 'use_by')
    {
        $this->ingredient = $ingredient;
        $this->expirationType = $expirationType;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            return;
        }

        $service = app(InventoryExpirationService::class);
        $result = $service->validateRestockExpirationDate($value, $this->ingredient, $this->expirationType);

        if (!$result['valid']) {
            $fail($result['message'] ?? InventoryExpirationService::EXPIRED_DATE_ERROR_MESSAGE);
        }
    }
}

