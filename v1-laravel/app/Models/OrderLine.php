<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderLine extends Model
{
    protected $fillable = [
        'order_id', 'item_id', 'requested_qty', 'shipped_qty',
        'received_qty', 'final_qty', 'unit_price', 'line_total', 'notes',
    ];

    protected $casts = [
        'requested_qty' => 'decimal:2',
        'shipped_qty' => 'decimal:2',
        'received_qty' => 'decimal:2',
        'final_qty' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function getFinalQty(): float
    {
        return $this->final_qty ?? $this->received_qty ?? $this->shipped_qty ?? $this->requested_qty;
    }

    public function calculateLineTotal(): float
    {
        $qty = $this->getFinalQty();
        return round($qty * ($this->unit_price ?? 0), 2);
    }
}
