<?php

namespace App\Providers;

use App\Models\{Order, OrderLine, Item, Store, Invoice, PriceMaster};
use App\Observers\AuditObserver;
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
