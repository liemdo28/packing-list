<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceMaster extends Model
{
    protected $table = 'price_master';

    protected $fillable = ['item_id', 'price', 'effective_from', 'effective_to', 'created_by'];

    protected $casts = [
        'price' => 'decimal:2',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        $today = now()->toDateString();
        return $query->where('effective_from', '<=', $today)
            ->where(function ($q) use ($today) {
                $q->whereNull('effective_to')
                  ->orWhere('effective_to', '>=', $today);
            });
    }
}
