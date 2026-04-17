<?php

namespace App\Domains\CostEngine\Services;

use App\Domains\CostEngine\Models\CostCalculation;
use App\Domains\Inventory\Models\PriceMaster;
use App\Domains\CostEngine\Models\Recipe;
use App\Domains\User\Models\User;

class CostEngineService
{
    /**
     * Calculate the full cost for a recipe and save a CostCalculation record.
     */
    public function calculateItemCost(Recipe $recipe): array
    {
        $breakdown = $recipe->calculateCost();

        $calculation = CostCalculation::create([
            'item_id' => $recipe->item_id,
            'recipe_id' => $recipe->id,
            'calculated_at' => now(),
            'total_ingredient_cost' => $breakdown['total_ingredient_cost'],
            'labor_cost' => $breakdown['labor_cost'],
            'waste_amount' => $breakdown['waste_amount'],
            'subtotal' => $breakdown['subtotal'],
            'markup_amount' => $breakdown['markup_amount'],
            'final_cost' => $breakdown['final_cost'],
            'cost_per_unit' => $breakdown['cost_per_unit'],
            'status' => 'draft',
        ]);

        $breakdown['calculation_id'] = $calculation->id;

        return $breakdown;
    }

    /**
     * Approve a cost calculation and update the item's price in price_master.
     */
    public function approveCost(CostCalculation $calc, User $user): void
    {
        $calc->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        // Archive any previous approved calculations for this item
        CostCalculation::where('item_id', $calc->item_id)
            ->where('id', '!=', $calc->id)
            ->where('status', 'approved')
            ->update(['status' => 'archived']);

        // Update the item's price in price_master
        PriceMaster::create([
            'item_id' => $calc->item_id,
            'price' => $calc->cost_per_unit,
            'effective_from' => now()->toDateString(),
            'effective_to' => null,
            'created_by' => $user->id,
        ]);
    }

    /**
     * Recalculate costs for all active recipes.
     */
    public function recalculateAll(): array
    {
        $results = [];
        $recipes = Recipe::where('active', true)->with('lines.rawMaterial')->get();

        foreach ($recipes as $recipe) {
            $results[] = [
                'item_id' => $recipe->item_id,
                'recipe_id' => $recipe->id,
                'recipe_name' => $recipe->name,
                'breakdown' => $this->calculateItemCost($recipe),
            ];
        }

        return $results;
    }
}
