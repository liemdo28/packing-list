<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_number', 'from_store_id', 'to_store_id', 'status',
        'created_by', 'submitted_at', 'processing_at', 'ready_at',
        'shipped_at', 'received_at', 'completed_at',
        'notes', 'cancel_reason',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'processing_at' => 'datetime',
        'ready_at' => 'datetime',
        'shipped_at' => 'datetime',
        'received_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function fromStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'from_store_id');
    }

    public function toStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'to_store_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(OrderLine::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function isDraft(): bool { return $this->status === 'draft'; }
    public function isSubmitted(): bool { return $this->status === 'submitted'; }
    public function isProcessing(): bool { return $this->status === 'processing'; }
    public function isReadyToShip(): bool { return $this->status === 'ready_to_ship'; }
    public function isInTransit(): bool { return $this->status === 'in_transit'; }
    public function isReceivedPending(): bool { return $this->status === 'received_pending_confirmation'; }
    public function isCompleted(): bool { return $this->status === 'completed'; }
    public function isCancelled(): bool { return $this->status === 'cancelled'; }
    public function isDisputed(): bool { return $this->status === 'disputed'; }

    public function canBeEdited(): bool { return $this->isDraft(); }
    public function canBeSubmitted(): bool { return $this->isDraft(); }
    public function canBeProcessed(): bool { return $this->isSubmitted(); }
    public function canBeReadyToShip(): bool { return $this->isProcessing(); }
    public function canBeInTransit(): bool { return $this->isReadyToShip(); }
    public function canBeReceived(): bool { return $this->isInTransit(); }
    public function canBeCompleted(): bool { return $this->isReceivedPending(); }
    public function canBeCancelled(): bool { return in_array($this->status, ['draft', 'submitted', 'processing']); }
    public function canBeDisputed(): bool { return $this->isReceivedPending(); }

    public function getStatusColor(): string
    {
        return config('packinglist.status_colors')[$this->status] ?? 'gray';
    }

    public function getTotalAmount(): float
    {
        return $this->lines->sum('line_total') ?? 0;
    }

    public function scopeForStore($query, $storeId)
    {
        return $query->where(function ($q) use ($storeId) {
            $q->where('from_store_id', $storeId)
              ->orWhere('to_store_id', $storeId);
        });
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByPair($query, $fromStoreId, $toStoreId)
    {
        return $query->where('from_store_id', $fromStoreId)
                     ->where('to_store_id', $toStoreId);
    }

    public static function generateOrderNumber(): string
    {
        $date = now()->format('Ymd');
        $lastOrder = static::where('order_number', 'like', "PL-{$date}-%")
            ->orderByDesc('order_number')
            ->first();

        if ($lastOrder) {
            $lastNum = (int) substr($lastOrder->order_number, -3);
            $nextNum = str_pad($lastNum + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $nextNum = '001';
        }

        return "PL-{$date}-{$nextNum}";
    }
}
