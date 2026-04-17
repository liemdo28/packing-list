<?php

namespace App\Domains\InvoiceScan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScanJob extends Model
{
    protected $fillable = [
        'requested_by', 'month', 'year', 'vendor_id', 'status',
        'total_files', 'parsed_files', 'failed_files',
        'matched_items', 'updated_prices', 'kept_old_prices',
        'started_at', 'finished_at', 'error_message',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'month' => 'integer',
        'year' => 'integer',
        'total_files' => 'integer',
        'parsed_files' => 'integer',
        'failed_files' => 'integer',
        'matched_items' => 'integer',
        'updated_prices' => 'integer',
        'kept_old_prices' => 'integer',
    ];

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(ScanJobFile::class);
    }

    public function priceUpdates(): HasMany
    {
        return $this->hasMany(ScanJobPriceUpdate::class);
    }
}
