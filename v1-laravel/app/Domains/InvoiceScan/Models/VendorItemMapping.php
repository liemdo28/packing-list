<?php

namespace App\Domains\InvoiceScan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorItemMapping extends Model
{
    protected $fillable = [
        'vendor_id', 'vendor_item_name', 'normalized_name',
        'raw_material_id', 'match_status',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }
}
