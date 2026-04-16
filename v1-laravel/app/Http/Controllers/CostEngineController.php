<?php

namespace App\Http\Controllers;

use App\Models\CostCalculation;
use App\Models\Item;
use App\Models\RawMaterial;
use App\Models\Recipe;
use App\Models\RecipeLine;
use App\Services\CostEngineService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CostEngineController extends Controller
{
    protected CostEngineService $costEngine;

    public function __construct(CostEngineService $costEngine)
    {
        $this->costEngine = $costEngine;
    }

    public function index()
    {
        $items = Item::query()
            ->with([
                'recipes' => fn($q) => $q->where('active', true)->orderByDesc('version'),
                'costCalculations' => fn($q) => $q->orderByDesc('calculated_at')->limit(1),
            ])
            ->orderBy('code')
            ->paginate(20);

        // Compute latest cost and recipe status for each item
        $items->getCollection()->transform(function ($item) {
            $recipe = $item->recipes->first();
            $latestCalc = $item->costCalculations->first();

            $item->has_recipe = $recipe !== null;
            $item->latest_cost = $latestCalc ? (float) $latestCalc->final_cost : null;
            $item->cost_per_unit = $latestCalc ? (float) $latestCalc->cost_per_unit : null;
            $item->cost_status = $latestCalc ? $latestCalc->status : null;
            $item->current_price = $item->getCurrentPriceValue();

            // Remove loaded relations to keep payload clean
            unset($item->recipes, $item->costCalculations);

            return $item;
        });

        $rawMaterialCount = RawMaterial::where('active', true)->count();

        return Inertia::render('CostEngine/Index', [
            'items' => $items,
            'rawMaterialCount' => $rawMaterialCount,
        ]);
    }

    public function show(Item $item)
    {
        $recipe = $item->activeRecipe();

        $recipeData = null;
        $breakdown = null;
        $latestCalc = null;

        if ($recipe) {
            $recipe->load('lines.rawMaterial');

            // Build lines with current prices
            $linesWithPrices = $recipe->lines->map(function ($line) {
                $latestPrice = $line->rawMaterial->latestPrice();
                return [
                    'id' => $line->id,
                    'raw_material_id' => $line->raw_material_id,
                    'raw_material_name' => $line->rawMaterial->name,
                    'raw_material_code' => $line->rawMaterial->code,
                    'qty_required' => (float) $line->qty_required,
                    'unit' => $line->unit,
                    'unit_price' => $latestPrice ? (float) $latestPrice->unit_price : 0,
                    'line_cost' => round((float) $line->qty_required * ($latestPrice ? (float) $latestPrice->unit_price : 0), 2),
                    'sort_order' => $line->sort_order,
                    'notes' => $line->notes,
                ];
            });

            $recipeData = [
                'id' => $recipe->id,
                'name' => $recipe->name,
                'version' => $recipe->version,
                'output_qty' => (float) $recipe->output_qty,
                'output_unit' => $recipe->output_unit,
                'labor_hours' => (float) $recipe->labor_hours,
                'labor_rate' => (float) $recipe->labor_rate,
                'waste_percent' => (float) $recipe->waste_percent,
                'markup_percent' => (float) $recipe->markup_percent,
                'notes' => $recipe->notes,
                'lines' => $linesWithPrices,
            ];

            $breakdown = $recipe->calculateCost();

            $latestCalc = CostCalculation::where('recipe_id', $recipe->id)
                ->orderByDesc('calculated_at')
                ->first();
        }

        $costHistory = CostCalculation::where('item_id', $item->id)
            ->with('approvedBy:id,name')
            ->orderByDesc('calculated_at')
            ->limit(10)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'calculated_at' => $c->calculated_at->format('Y-m-d H:i'),
                'total_ingredient_cost' => (float) $c->total_ingredient_cost,
                'labor_cost' => (float) $c->labor_cost,
                'waste_amount' => (float) $c->waste_amount,
                'subtotal' => (float) $c->subtotal,
                'markup_amount' => (float) $c->markup_amount,
                'final_cost' => (float) $c->final_cost,
                'cost_per_unit' => (float) $c->cost_per_unit,
                'status' => $c->status,
                'approved_by_name' => $c->approvedBy?->name,
                'approved_at' => $c->approved_at?->format('Y-m-d H:i'),
            ]);

        return Inertia::render('CostEngine/Show', [
            'item' => [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'unit' => $item->unit,
                'category' => $item->category,
                'current_price' => $item->getCurrentPriceValue(),
            ],
            'recipe' => $recipeData,
            'breakdown' => $breakdown,
            'latestCalc' => $latestCalc ? [
                'id' => $latestCalc->id,
                'status' => $latestCalc->status,
                'calculated_at' => $latestCalc->calculated_at->format('Y-m-d H:i'),
                'final_cost' => (float) $latestCalc->final_cost,
                'cost_per_unit' => (float) $latestCalc->cost_per_unit,
            ] : null,
            'costHistory' => $costHistory,
        ]);
    }

    public function editRecipe(Item $item)
    {
        $recipe = $item->activeRecipe();

        $recipeData = null;
        if ($recipe) {
            $recipe->load('lines');
            $recipeData = [
                'id' => $recipe->id,
                'name' => $recipe->name,
                'version' => $recipe->version,
                'output_qty' => (float) $recipe->output_qty,
                'output_unit' => $recipe->output_unit,
                'labor_hours' => (float) $recipe->labor_hours,
                'labor_rate' => (float) $recipe->labor_rate,
                'waste_percent' => (float) $recipe->waste_percent,
                'markup_percent' => (float) $recipe->markup_percent,
                'notes' => $recipe->notes,
                'lines' => $recipe->lines->map(fn($l) => [
                    'id' => $l->id,
                    'raw_material_id' => $l->raw_material_id,
                    'qty_required' => (float) $l->qty_required,
                    'unit' => $l->unit,
                    'sort_order' => $l->sort_order,
                    'notes' => $l->notes,
                ]),
            ];
        }

        $rawMaterials = RawMaterial::where('active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'base_unit']);

        $units = array_merge(
            config('packinglist.units'),
            ['L', 'mL', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'gallon', 'can', 'bottle']
        );
        $units = array_values(array_unique($units));

        return Inertia::render('CostEngine/EditRecipe', [
            'item' => [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'unit' => $item->unit,
            ],
            'recipe' => $recipeData,
            'rawMaterials' => $rawMaterials,
            'units' => $units,
        ]);
    }

    public function saveRecipe(Request $request, Item $item)
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'output_qty' => 'required|numeric|min:0.01',
            'output_unit' => 'required|string|max:20',
            'labor_hours' => 'required|numeric|min:0',
            'labor_rate' => 'required|numeric|min:0',
            'waste_percent' => 'required|numeric|min:0|max:100',
            'markup_percent' => 'required|numeric|min:0|max:200',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.raw_material_id' => 'required|exists:raw_materials,id',
            'lines.*.qty_required' => 'required|numeric|min:0.0001',
            'lines.*.unit' => 'required|string|max:20',
            'lines.*.notes' => 'nullable|string|max:255',
        ]);

        $existingRecipe = $item->activeRecipe();

        if ($existingRecipe) {
            // Update existing recipe
            $existingRecipe->update([
                'name' => $data['name'],
                'output_qty' => $data['output_qty'],
                'output_unit' => $data['output_unit'],
                'labor_hours' => $data['labor_hours'],
                'labor_rate' => $data['labor_rate'],
                'waste_percent' => $data['waste_percent'],
                'markup_percent' => $data['markup_percent'],
                'notes' => $data['notes'] ?? null,
            ]);

            // Replace all lines
            $existingRecipe->lines()->delete();

            foreach ($data['lines'] as $i => $line) {
                RecipeLine::create([
                    'recipe_id' => $existingRecipe->id,
                    'raw_material_id' => $line['raw_material_id'],
                    'qty_required' => $line['qty_required'],
                    'unit' => $line['unit'],
                    'sort_order' => $i,
                    'notes' => $line['notes'] ?? null,
                ]);
            }
        } else {
            // Create new recipe
            $recipe = Recipe::create([
                'item_id' => $item->id,
                'name' => $data['name'],
                'version' => 1,
                'output_qty' => $data['output_qty'],
                'output_unit' => $data['output_unit'],
                'labor_hours' => $data['labor_hours'],
                'labor_rate' => $data['labor_rate'],
                'waste_percent' => $data['waste_percent'],
                'markup_percent' => $data['markup_percent'],
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['lines'] as $i => $line) {
                RecipeLine::create([
                    'recipe_id' => $recipe->id,
                    'raw_material_id' => $line['raw_material_id'],
                    'qty_required' => $line['qty_required'],
                    'unit' => $line['unit'],
                    'sort_order' => $i,
                    'notes' => $line['notes'] ?? null,
                ]);
            }
        }

        return redirect()->route('cost-engine.show', $item)->with('success', 'Recipe saved successfully.');
    }

    public function calculate(Item $item)
    {
        $recipe = $item->activeRecipe();

        if (!$recipe) {
            return redirect()->back()->with('error', 'No active recipe found for this item.');
        }

        $recipe->load('lines.rawMaterial');
        $this->costEngine->calculateItemCost($recipe);

        return redirect()->route('cost-engine.show', $item)->with('success', 'Cost calculated successfully.');
    }

    public function approve(CostCalculation $calculation)
    {
        $this->costEngine->approveCost($calculation, auth()->user());

        return redirect()->route('cost-engine.show', $calculation->item_id)
            ->with('success', 'Cost approved and price updated.');
    }

    public function recalculateAll()
    {
        $results = $this->costEngine->recalculateAll();

        return redirect()->route('cost-engine.index')
            ->with('success', count($results) . ' recipes recalculated successfully.');
    }
}
