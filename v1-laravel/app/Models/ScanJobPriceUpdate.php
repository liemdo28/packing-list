<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScanJobPriceUpdate extends Model
{
    protected $fillable = [
        'scan_job_id', 'scan_job_file_id', 'raw_material_id',
        'raw_item_name', 'unit', 'old_price', 'new_price',
        'action', 'notes',
    ];

    protected $casts = [
        'old_price' => 'decimal:2',
        'new_price' => 'decimal:2',
    ];

    public function scanJob(): BelongsTo
    {
        return $this->belongsTo(ScanJob::class);
    }

    public function scanJobFile(): BelongsTo
    {
        return $this->belongsTo(ScanJobFile::class);
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }
}
