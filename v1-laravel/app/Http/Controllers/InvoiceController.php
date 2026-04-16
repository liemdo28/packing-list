<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Item;
use App\Models\Store;
use App\Models\Order;
use App\Models\OrderLine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InvoiceController extends Controller
{
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

        DB::transaction(function () use ($data) {
            $totalAmount = 0;
            $lines = [];
            foreach ($data['lines'] as $line) {
                $lineTotal = round($line['qty'] * $line['unit_price'], 2);
                $totalAmount += $lineTotal;
                $lines[] = array_merge($line, ['line_total' => $lineTotal]);
            }

            $invoice = Invoice::create([
                'supplier' => $data['supplier'],
                'invoice_number' => $data['invoice_number'],
                'invoice_date' => $data['invoice_date'],
                'total_amount' => $totalAmount,
                'store_id' => $data['store_id'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($lines as $line) {
                $invoice->lines()->create($line);
            }
        });

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

        $completedOrderLines = OrderLine::whereHas('order', function ($q) {
            $q->where('status', 'completed');
        })->with('item', 'order')->get();

        return Inertia::render('Invoices/Reconcile', compact('invoice', 'completedOrderLines'));
    }

    public function doReconcile(Request $request, Invoice $invoice)
    {
        DB::transaction(function () use ($invoice) {
            foreach ($invoice->lines as $line) {
                $matched = OrderLine::whereHas('order', function ($q) {
                    $q->where('status', 'completed');
                })->where('item_id', $line->item_id)->exists();

                $line->update(['matched' => $matched]);
            }

            $invoice->update([
                'reconciled' => true,
                'reconciled_at' => now(),
                'reconciled_by' => auth()->id(),
            ]);
        });

        return redirect()->route('invoices.show', $invoice)->with('success', 'Invoice reconciled.');
    }
}
