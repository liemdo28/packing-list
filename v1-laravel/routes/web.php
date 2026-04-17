<?php

use App\Domains\User\Http\Controllers\LoginController;
use App\Domains\Dashboard\Http\Controllers\DashboardController;
use App\Domains\User\Http\Controllers\StoreController;
use App\Domains\Inventory\Http\Controllers\ItemController;
use App\Domains\Inventory\Http\Controllers\PriceMasterController;
use App\Domains\Order\Http\Controllers\OrderController;
use App\Domains\Notification\Http\Controllers\NotificationController;
use App\Domains\Report\Http\Controllers\SummaryController;
use App\Domains\Invoice\Http\Controllers\InvoiceController;
use App\Domains\Audit\Http\Controllers\AuditLogController;
use App\Domains\User\Http\Controllers\UserController;
use App\Domains\CostEngine\Http\Controllers\CostEngineController;
use App\Domains\CostEngine\Http\Controllers\RawMaterialController;
use App\Domains\InvoiceScan\Http\Controllers\InvoiceScanController;
use App\Domains\InvoiceScan\Http\Controllers\VendorController;
use App\Domains\Report\Http\Controllers\ExportController;
use App\Domains\Packing\Http\Controllers\PackingController;
use Illuminate\Support\Facades\Route;

// Auth
Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

Route::redirect('/', '/dashboard');

// Authenticated routes
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Notifications (all authenticated users)
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.readAll');
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unreadCount');
    Route::get('/notifications/recent', [NotificationController::class, 'recent'])->name('notifications.recent');

    // Orders (store users + admin + accountant view)
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');

    // Order actions (store users only)
    Route::middleware('role:admin,b1,b2,b3')->group(function () {
        Route::get('/orders/create/new', [OrderController::class, 'create'])->name('orders.create');
        Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');
        Route::post('/orders/{order}/submit', [OrderController::class, 'submit'])->name('orders.submit');
        Route::post('/orders/{order}/process', [OrderController::class, 'process'])->name('orders.process');
        Route::post('/orders/{order}/mark-ready', [OrderController::class, 'markReady'])->name('orders.markReady');
        Route::post('/orders/{order}/transit', [OrderController::class, 'transit'])->name('orders.transit');
        Route::post('/orders/{order}/receive', [OrderController::class, 'receive'])->name('orders.receive');
        Route::post('/orders/{order}/complete', [OrderController::class, 'complete'])->name('orders.complete');
        Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
        Route::post('/orders/{order}/dispute', [OrderController::class, 'dispute'])->name('orders.dispute');
    });

    // Accountant routes
    Route::middleware('role:admin,accountant')->group(function () {
        Route::get('/summary', [SummaryController::class, 'index'])->name('summary.index');
        Route::get('/summary/pair-detail', [SummaryController::class, 'pairDetail'])->name('summary.pairDetail');
        Route::get('/summary/export/excel', [SummaryController::class, 'exportExcel'])->name('summary.exportExcel');

        Route::resource('invoices', InvoiceController::class)->only(['index', 'create', 'store', 'show']);
        Route::get('/invoices/{invoice}/reconcile', [InvoiceController::class, 'reconcile'])->name('invoices.reconcile');
        Route::post('/invoices/{invoice}/reconcile', [InvoiceController::class, 'doReconcile'])->name('invoices.doReconcile');
    });

    // Admin routes
    Route::middleware('role:admin')->group(function () {
        Route::resource('stores', StoreController::class);
        Route::resource('items', ItemController::class);
        Route::resource('users', UserController::class)->except('show', 'destroy');

        Route::get('/prices', [PriceMasterController::class, 'index'])->name('prices.index');
        Route::get('/prices/create', [PriceMasterController::class, 'create'])->name('prices.create');
        Route::post('/prices', [PriceMasterController::class, 'store'])->name('prices.store');
        Route::get('/prices/history/{item}', [PriceMasterController::class, 'history'])->name('prices.history');

        Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');

        // Cost Engine
        Route::prefix('cost-engine')->group(function () {
            Route::get('/', [CostEngineController::class, 'index'])->name('cost-engine.index');
            Route::post('/recalculate-all', [CostEngineController::class, 'recalculateAll'])->name('cost-engine.recalculateAll');
            Route::get('/{item}', [CostEngineController::class, 'show'])->name('cost-engine.show');
            Route::get('/{item}/recipe', [CostEngineController::class, 'editRecipe'])->name('cost-engine.recipe');
            Route::post('/{item}/recipe', [CostEngineController::class, 'saveRecipe'])->name('cost-engine.saveRecipe');
            Route::post('/{item}/calculate', [CostEngineController::class, 'calculate'])->name('cost-engine.calculate');
            Route::post('/calculations/{calculation}/approve', [CostEngineController::class, 'approve'])->name('cost-engine.approve');
        });

        // Raw Materials
        Route::resource('raw-materials', RawMaterialController::class)->except('destroy', 'show');
        Route::post('raw-materials/{raw_material}/price', [RawMaterialController::class, 'updatePrice'])->name('raw-materials.updatePrice');

        // Invoice Scan
        Route::prefix('invoice-scan')->group(function () {
            Route::get('/', [InvoiceScanController::class, 'index'])->name('invoice-scan.index');
            Route::get('/configs', [InvoiceScanController::class, 'configs'])->name('invoice-scan.configs');
            Route::post('/configs', [InvoiceScanController::class, 'storeConfig'])->name('invoice-scan.storeConfig');
            Route::post('/scan', [InvoiceScanController::class, 'scan'])->name('invoice-scan.scan');
            Route::get('/results/{scanJob}', [InvoiceScanController::class, 'results'])->name('invoice-scan.results');
            Route::get('/review/{scanJob}', [InvoiceScanController::class, 'review'])->name('invoice-scan.review');
            Route::post('/map-item', [InvoiceScanController::class, 'mapItem'])->name('invoice-scan.mapItem');
        });

        // Vendors
        Route::resource('vendors', VendorController::class)->except('show', 'destroy');

        // Packing
        Route::resource('packing', PackingController::class)->except(['show', 'destroy']);
        Route::get('/packing/{packing}', [PackingController::class, 'show'])->name('packing.show');
        Route::post('/packing/{packing}/items', [PackingController::class, 'addItem'])->name('packing.items.add');
        Route::put('/packing/{packing}/items/{item}', [PackingController::class, 'updateItem'])->name('packing.items.update');
        Route::delete('/packing/{packing}/items/{item}', [PackingController::class, 'removeItem'])->name('packing.items.remove');
        Route::post('/packing/{packing}/mark-all-packed', [PackingController::class, 'markAllPacked'])->name('packing.markAllPacked');
        Route::post('/packing/{packing}/ship', [PackingController::class, 'markShipped'])->name('packing.ship');
        Route::get('/packing/{packing}/checklist-pdf', [PackingController::class, 'checklistPdf'])->name('packing.checklistPdf');

        // Packing Templates
        Route::prefix('packing/templates')->name('packing.templates.')->group(function () {
            Route::get('/', [PackingController::class, 'templateIndex'])->name('index');
            Route::get('/create', [PackingController::class, 'templateCreate'])->name('create');
            Route::post('/', [PackingController::class, 'templateStore'])->name('store');
            Route::get('/{template}/edit', [PackingController::class, 'templateEdit'])->name('edit');
            Route::put('/{template}', [PackingController::class, 'templateUpdate'])->name('update');
            Route::delete('/{template}', [PackingController::class, 'templateDestroy'])->name('destroy');
        });
    });

    // Export routes
    Route::get('/export/orders/excel', [ExportController::class, 'ordersExcel'])->name('export.orders.excel');
    Route::get('/export/orders/{order}/pdf', [ExportController::class, 'orderPdf'])->name('export.orders.pdf');
});
