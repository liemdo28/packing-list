<?php

namespace App\Domains\Packing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PackingJob extends Model
{
    protected $fillable = [
        'name', 'type', 'status', 'order_id',
        'from_store_id', 'notes', 'created_by',
    ];

    protected $casts = [
        'packed_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(\App\Domains\Order\Models\Order::class);
    }

    public function fromStore(): BelongsTo
    {
        return $this->belongsTo(\App\Domains\User\Models\Store::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Domains\User\Models\User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PackingItem::class, 'packing_job_id');
    }

    public function isDraft(): bool { return $this->status === 'draft'; }
    public function isPacking(): bool { return $this->status === 'packing'; }
    public function isPacked(): bool { return $this->status === 'packed'; }
    public function isShipped(): bool { return $this->status === 'shipped'; }

    public function canStartPacking(): bool { return $this->isDraft(); }
    public function canMarkShipped(): bool { return $this->isPacked(); }

    public function getProgressAttribute(): float
    {
        $total = $this->items->count();
        if ($total === 0) return 0;
        return round(($this->items->where('packed', true)->count() / $total) * 100, 1);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }
}