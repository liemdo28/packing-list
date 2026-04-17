<?php

namespace App\Providers;

use App\Domains\Order\Models\Order;
use App\Domains\Order\Models\OrderLine;
use App\Domains\Inventory\Models\Item;
use App\Domains\User\Models\Store;
use App\Domains\Invoice\Models\Invoice;
use App\Domains\Inventory\Models\PriceMaster;
use App\Domains\Audit\Observers\AuditObserver;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Order::observe(AuditObserver::class);
        OrderLine::observe(AuditObserver::class);
        Item::observe(AuditObserver::class);
        Store::observe(AuditObserver::class);
        Invoice::observe(AuditObserver::class);
        PriceMaster::observe(AuditObserver::class);

        Blade::if('role', function (string ...$roles) {
            return auth()->check() && auth()->user()->hasRole($roles);
        });
    }
}
