<?php

namespace App\Domains\Invoice\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonthlySummary extends Model
{
    protected $fillable = ['year', 'month', 'from_store_id', 'to_store_id', 'total_orders', 'total_amount', 'generated_at'];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'generated_at' => 'datetime',
    ];

    public function fromStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'from_store_id');
    }

    public function toStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'to_store_id');
    }
}
