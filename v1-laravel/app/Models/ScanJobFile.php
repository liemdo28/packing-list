<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScanJobFile extends Model
{
    protected $fillable = [
        'scan_job_id', 'file_name', 'file_type', 'file_url',
        'parse_status', 'vendor_name_parsed', 'invoice_number_parsed',
        'invoice_date_parsed', 'error_message',
    ];

    protected $casts = [
        'invoice_date_parsed' => 'date',
    ];

    public function scanJob(): BelongsTo
    {
        return $this->belongsTo(ScanJob::class);
    }

    public function priceUpdates(): HasMany
    {
        return $this->hasMany(ScanJobPriceUpdate::class);
    }
}
