<?php

namespace App\Domains\CostEngine\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecipeLine extends Model
{
    protected $fillable = [
        'recipe_id', 'raw_material_id', 'qty_required', 'unit',
        'sort_order', 'notes',
    ];

    protected $casts = [
        'qty_required' => 'decimal:4',
        'sort_order' => 'integer',
    ];

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }
}
