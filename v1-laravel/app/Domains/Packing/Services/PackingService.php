<?php

namespace App\Domains\Packing\Services;

use App\Domains\Order\Models\Order;
use App\Domains\Packing\Models\PackingJob;
use App\Domains\Packing\Models\PackingItem;
use App\Domains\Packing\Models\PackingTemplate;
use App\Domains\Inventory\Models\Item;
use Illuminate\Support\Facades\DB;

class PackingService
{
    /**
     * Create a packing job from an existing order's lines.
     */
    public function createFromOrder(Order $order, array $data): PackingJob
    {
        return DB::transaction(function () use ($order, $data) {
            $job = PackingJob::create([
                'name' => $data['name'] ?? "Packing #{$order->order_number}",
                'type' => 'transfer',
                'status' => 'draft',
                'order_id' => $order->id,
                'from_store_id' => $order->from_store_id,
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            foreach ($order->lines as $line) {
                $job->items()->create([
                    'item_id' => $line->item_id,
                    'quantity' => $line->requested_qty,
                    'packed_qty' => 0,
                    'packed' => false,
                ]);
            }

            return $job->load('items.item', 'fromStore', 'order', 'creator');
        });
    }

    /**
     * Create a blank packing job.
     */
    public function createBlank(array $data): PackingJob
    {
        return DB::transaction(function () use ($data) {
            $job = PackingJob::create([
                'name' => $data['name'],
                'type' => $data['type'] ?? 'shipment',
                'status' => 'draft',
                'order_id' => $data['order_id'] ?? null,
                'from_store_id' => $data['from_store_id'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            return $job->load('items.item', 'fromStore', 'order', 'creator');
        });
    }

    /**
     * Create a packing job from a template.
     */
    public function createFromTemplate(PackingTemplate $template, array $data): PackingJob
    {
        return DB::transaction(function () use ($template, $data) {
            $job = PackingJob::create([
                'name' => $data['name'],
                'type' => $data['type'] ?? 'shipment',
                'status' => 'draft',
                'from_store_id' => $data['from_store_id'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            foreach ($template->items as $ti) {
                $job->items()->create([
                    'item_id' => $ti->item_id,
                    'quantity' => $ti->default_qty,
                    'packed_qty' => 0,
                    'packed' => false,
                ]);
            }

            return $job->load('items.item', 'fromStore', 'creator');
        });
    }

    /**
     * Add an item to a packing job.
     */
    public function addItem(PackingJob $job, Item $item, float $qty): PackingItem
    {
        return $job->items()->create([
            'item_id' => $item->id,
            'quantity' => $qty,
            'packed_qty' => 0,
            'packed' => false,
        ]);
    }

    /**
     * Update a packing item (quantity, packed status).
     */
    public function updateItem(PackingItem $item, array $data): PackingItem
    {
        $data['packed'] = $data['packed'] ?? ($data['packed_qty'] >= $item->quantity);

        if ($data['packed'] && !$item->packed) {
            $data['packed_at'] = now();
        } elseif (!$data['packed']) {
            $data['packed_at'] = null;
        }

        $item->update($data);

        // Auto-update job status
        $this->updateJobStatus($item->packingJob);

        return $item->fresh();
    }

    /**
     * Remove an item from a packing job.
     */
    public function removeItem(PackingItem $item): void
    {
        $job = $item->packingJob;
        $item->delete();
        $this->updateJobStatus($job);
    }

    /**
     * Mark all items in a job as packed.
     */
    public function markAllPacked(PackingJob $job): PackingJob
    {
        return DB::transaction(function () use ($job) {
            $job->items()->update([
                'packed' => true,
                'packed_qty' => DB::raw('quantity'),
                'packed_at' => now(),
            ]);

            $job->update(['status' => 'packed']);

            return $job->fresh('items.item');
        });
    }

    /**
     * Mark job as shipped.
     */
    public function markShipped(PackingJob $job): PackingJob
    {
        $job->update(['status' => 'shipped']);
        return $job->fresh('items.item');
    }

    /**
     * Generate checklist data for PDF export.
     */
    public function generateChecklist(PackingJob $job): array
    {
        $job->load('items.item', 'fromStore', 'creator');

        return [
            'job' => $job,
            'items' => $job->items->map(fn ($item) => [
                'name' => $item->item->name,
                'sku' => $item->item->sku,
                'quantity' => $item->quantity,
                'packed' => $item->packed ? '✓' : '☐',
                'packed_qty' => $item->packed_qty,
                'notes' => $item->notes,
            ]),
            'from' => $job->fromStore?->name,
            'date' => $job->created_at->format('Y-m-d'),
            'progress' => $job->progress,
        ];
    }

    /**
     * Auto-update job status based on items state.
     */
    protected function updateJobStatus(PackingJob $job): void
    {
        $job->refresh();
        $total = $job->items->count();
        $packed = $job->items->where('packed', true)->count();

        if ($total === 0) {
            $job->update(['status' => 'draft']);
        } elseif ($packed === 0) {
            $job->update(['status' => 'draft']);
        } elseif ($packed < $total) {
            $job->update(['status' => 'packing']);
        } else {
            $job->update(['status' => 'packed']);
        }
    }
}
