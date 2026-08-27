<?php

namespace App\Providers;

use App\Events\OrderStatusUpdated;
use App\Jobs\SendCustomerPushNotification;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerPolicies();
        $this->registerEventListeners();
    }

    /**
     * Register event → queued job listeners for push notifications.
     */
    protected function registerEventListeners(): void
    {
        Event::listen(OrderStatusUpdated::class, function (OrderStatusUpdated $event): void {
            $delivery = $event->delivery;

            // Only dispatch for mobile (customer-app) orders with a known user
            $userId = $delivery->order?->user_id;
            if (!$userId) {
                return;
            }

            $orderId = $delivery->order_id;
            $orderNumber = $delivery->order?->order_number ?? '';
            $status = $delivery->status;

            SendCustomerPushNotification::forOrderStatus(
                userId:      $userId,
                orderId:     (int) $orderId,
                status:      $status,
                orderNumber: (string) $orderNumber,
            );
        });
    }

    protected function registerPolicies(): void
    {
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Product::class, \App\Policies\ResourcePolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Category::class, \App\Policies\ResourcePolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Ingredient::class, \App\Policies\IngredientPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Sale::class, \App\Policies\ResourcePolicy::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
