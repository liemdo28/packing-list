<?php

namespace App\Domains\Invoice\Http\Controllers;

use App\Domains\Invoice\Models\Invoice;
use App\Domains\Invoice\Services\InvoiceService;
use App\Domains\Inventory\Models\Item;
use App\Domains\User\Models\Store;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function __construct(protected InvoiceService $invoiceService) {}

    public function index()
    {
        $invoices = Invoice::with('store')
            ->orderByDesc('invoice_date')
            ->paginate(20);
        $stores = Store::active()->get();
        return Inertia::render('Invoices/Index', compact('invoices', 'stores'));
    }

    public function create()
    {
        $stores = Store::active()->get();
        $items = Item::active()->orderBy('name')->get();
        return Inertia::render('Invoices/Create', compact('stores', 'items'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'supplier' => 'required|string|max:100',
            'invoice_number' => 'required|string|max:50',
            'invoice_date' => 'required|date',
            'store_id' => 'nullable|exists:stores,id',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.item_id' => 'nullable|exists:items,id',
            'lines.*.description' => 'nullable|string|max:200',
            'lines.*.qty' => 'required|numeric|min:0.01',
            'lines.*.unit_price' => 'required|numeric|min:0',
        ]);

        $this->invoiceService->createInvoice($data);

        return redirect()->route('invoices.index')->with('success', 'Invoice created successfully.');
    }

    public function show(Invoice $invoice)
    {
        $invoice->load('lines.item', 'store', 'reconciledByUser');
        return Inertia::render('Invoices/Show', compact('invoice'));
    }

    public function reconcile(Invoice $invoice)
    {
        $invoice->load('lines.item');
        $completedOrderLines = $this->invoiceService->getReconciliationMatches($invoice);

        return Inertia::render('Invoices/Reconcile', compact('invoice', 'completedOrderLines'));
    }

    public function doReconcile(Request $request, Invoice $invoice)
    {
        $this->invoiceService->reconcileInvoice($invoice);

        return redirect()->route('invoices.show', $invoice)->with('success', 'Invoice reconciled.');
    }
}
