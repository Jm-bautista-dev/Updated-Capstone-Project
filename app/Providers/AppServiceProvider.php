<?php

namespace App\Providers;

use App\Events\OrderStatusUpdated;
use App\Jobs\SendCustomerPushNotification;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
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
            $order = $event->order ?? $event->delivery?->order;
            $delivery = $event->delivery;

            // Only dispatch for mobile (customer-app) orders with a known user
            $userId = $order?->user_id;
            if (!$userId) {
                return;
            }

            $orderId = $order->id;
            $orderNumber = $order->order_number ?? '';
            $status = $delivery ? $delivery->status : (string) $order->status;
            $fulfillmentType = $order->fulfillment_type ?? ($delivery ? 'delivery' : 'pickup');

            SendCustomerPushNotification::forOrderStatus(
                userId:          $userId,
                orderId:         (int) $orderId,
                status:          $status,
                orderNumber:     (string) $orderNumber,
                extra:           [
                    'fulfillment_type' => $fulfillmentType,
                    'is_pickup'        => ($fulfillmentType === 'pickup'),
                ],
                fulfillmentType: $fulfillmentType,
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

        if (app()->isProduction() || str_starts_with((string) config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

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
