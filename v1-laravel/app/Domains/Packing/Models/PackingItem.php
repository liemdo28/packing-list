<?php

namespace App\Domains\Packing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PackingItem extends Model
{
    protected $fillable = [
        'packing_job_id', 'item_id', 'quantity',
        'packed_qty', 'packed', 'packed_at', 'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'packed_qty' => 'decimal:3',
        'packed' => 'boolean',
        'packed_at' => 'datetime',
    ];

    public function packingJob(): BelongsTo
    {
        return $this->belongsTo(PackingJob::class, 'packing_job_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(\App\Domains\Inventory\Models\Item::class);
    }

    public function isFullyPacked(): bool
    {
        return $this->packed && bccomp($this->packed_qty, $this->quantity, 3) >= 0;
    }
}