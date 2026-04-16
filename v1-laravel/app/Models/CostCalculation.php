<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CostCalculation extends Model
{
    protected $fillable = [
        'item_id', 'recipe_id', 'calculated_at',
        'total_ingredient_cost', 'labor_cost', 'waste_amount',
        'subtotal', 'markup_amount', 'final_cost', 'cost_per_unit',
        'status', 'approved_by', 'approved_at',
    ];

    protected $casts = [
        'calculated_at' => 'datetime',
        'approved_at' => 'datetime',
        'total_ingredient_cost' => 'decimal:2',
        'labor_cost' => 'decimal:2',
        'waste_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'markup_amount' => 'decimal:2',
        'final_cost' => 'decimal:2',
        'cost_per_unit' => 'decimal:2',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
