<?php

namespace App\Domains\Invoice\Services;

use App\Domains\Invoice\Models\Invoice;
use App\Domains\Invoice\Models\InvoiceLine;
use App\Domains\Order\Models\OrderLine;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    public function createInvoice(array $data): Invoice
    {
        return DB::transaction(function () use ($data) {
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

            return $invoice;
        });
    }

    public function reconcileInvoice(Invoice $invoice): Invoice
    {
        return DB::transaction(function () use ($invoice) {
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

            return $invoice->fresh('lines.item', 'store', 'reconciledByUser');
        });
    }

    public function getReconciliationMatches(Invoice $invoice): \Illuminate\Database\Eloquent\Collection
    {
        return OrderLine::whereHas('order', function ($q) {
            $q->where('status', 'completed');
        })->with('item', 'order')->get();
    }
}
