<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RawMaterialPrice extends Model
{
    protected $fillable = [
        'raw_material_id', 'vendor_name', 'unit', 'unit_price',
        'effective_date', 'source', 'active',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'effective_date' => 'date',
        'active' => 'boolean',
    ];

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }
}
