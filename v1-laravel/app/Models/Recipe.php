<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recipe extends Model
{
    protected $fillable = [
        'item_id', 'name', 'version', 'output_qty', 'output_unit',
        'labor_hours', 'labor_rate', 'waste_percent', 'markup_percent',
        'active', 'notes',
    ];

    protected $casts = [
        'output_qty' => 'decimal:2',
        'labor_hours' => 'decimal:2',
        'labor_rate' => 'decimal:2',
        'waste_percent' => 'decimal:2',
        'markup_percent' => 'decimal:2',
        'active' => 'boolean',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(RecipeLine::class)->orderBy('sort_order');
    }

    public function costCalculations(): HasMany
    {
        return $this->hasMany(CostCalculation::class);
    }

    /**
     * Calculate the full cost breakdown for this recipe.
     */
    public function calculateCost(): array
    {
        $lineDetails = [];
        $totalIngredientCost = 0;

        foreach ($this->lines()->with('rawMaterial')->get() as $line) {
            $rawMaterial = $line->rawMaterial;
            $latestPrice = $rawMaterial->latestPrice();
            $unitPrice = $latestPrice ? (float) $latestPrice->unit_price : 0;
            $priceUnit = $latestPrice ? $latestPrice->unit : $rawMaterial->base_unit;

            // Convert if units differ
            $effectivePrice = $unitPrice;
            if ($priceUnit !== $line->unit) {
                $converted = UnitConversion::convert(1, $line->unit, $priceUnit);
                if ($converted !== null) {
                    $effectivePrice = $unitPrice * $converted;
                }
            }

            $lineCost = (float) $line->qty_required * $effectivePrice;
            $totalIngredientCost += $lineCost;

            $lineDetails[] = [
                'raw_material_id' => $rawMaterial->id,
                'raw_material_name' => $rawMaterial->name,
                'qty_required' => (float) $line->qty_required,
                'unit' => $line->unit,
                'unit_price' => $effectivePrice,
                'line_cost' => round($lineCost, 2),
            ];
        }

        $laborCost = (float) $this->labor_hours * (float) $this->labor_rate;
        $wasteAmount = ($totalIngredientCost + $laborCost) * (float) $this->waste_percent / 100;
        $subtotal = $totalIngredientCost + $laborCost + $wasteAmount;
        $markupAmount = $subtotal * (float) $this->markup_percent / 100;
        $finalCost = $subtotal + $markupAmount;
        $costPerUnit = (float) $this->output_qty > 0 ? $finalCost / (float) $this->output_qty : 0;

        return [
            'lines' => $lineDetails,
            'total_ingredient_cost' => round($totalIngredientCost, 2),
            'labor_cost' => round($laborCost, 2),
            'waste_amount' => round($wasteAmount, 2),
            'subtotal' => round($subtotal, 2),
            'markup_amount' => round($markupAmount, 2),
            'final_cost' => round($finalCost, 2),
            'cost_per_unit' => round($costPerUnit, 2),
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
