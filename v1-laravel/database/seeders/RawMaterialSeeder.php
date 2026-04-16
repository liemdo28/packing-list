<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\RawMaterial;
use App\Models\RawMaterialPrice;
use App\Models\Recipe;
use App\Models\RecipeLine;
use App\Models\UnitConversion;
use Illuminate\Database\Seeder;

class RawMaterialSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Raw Materials ───────────────────────────────────────────
        $materials = [
            ['code' => 'RM-001', 'name' => 'Oyster Sauce',      'base_unit' => 'can',    'category' => 'Sauce'],
            ['code' => 'RM-002', 'name' => 'Sweet Chili Sauce',  'base_unit' => 'bottle', 'category' => 'Sauce'],
            ['code' => 'RM-003', 'name' => 'Brown Sugar',        'base_unit' => 'cup',    'category' => 'Sweetener'],
            ['code' => 'RM-004', 'name' => 'Soy Sauce',          'base_unit' => 'cup',    'category' => 'Sauce'],
            ['code' => 'RM-005', 'name' => 'Sesame Oil',         'base_unit' => 'cup',    'category' => 'Oil'],
            ['code' => 'RM-006', 'name' => 'Green Onion',        'base_unit' => 'cup',    'category' => 'Produce'],
            ['code' => 'RM-007', 'name' => 'Cilantro',           'base_unit' => 'cup',    'category' => 'Produce'],
            ['code' => 'RM-008', 'name' => 'Chicken Breast',     'base_unit' => 'lb',     'category' => 'Protein'],
            ['code' => 'RM-009', 'name' => 'Garlic',             'base_unit' => 'cup',    'category' => 'Produce'],
            ['code' => 'RM-010', 'name' => 'Vegetable Oil',      'base_unit' => 'cup',    'category' => 'Oil'],
            ['code' => 'RM-011', 'name' => 'Curry Base',         'base_unit' => 'can',    'category' => 'Sauce'],
            ['code' => 'RM-012', 'name' => 'Pork Shoulder',      'base_unit' => 'lb',     'category' => 'Protein'],
            ['code' => 'RM-013', 'name' => 'Rice',               'base_unit' => 'lb',     'category' => 'Grain'],
            ['code' => 'RM-014', 'name' => 'Coconut Milk',       'base_unit' => 'can',    'category' => 'Dairy'],
            ['code' => 'RM-015', 'name' => 'Fish Sauce',         'base_unit' => 'bottle', 'category' => 'Sauce'],
            ['code' => 'RM-016', 'name' => 'Sriracha',           'base_unit' => 'bottle', 'category' => 'Sauce'],
            ['code' => 'RM-017', 'name' => 'Ginger',             'base_unit' => 'cup',    'category' => 'Produce'],
            ['code' => 'RM-018', 'name' => 'Onion',              'base_unit' => 'pcs',    'category' => 'Produce'],
            ['code' => 'RM-019', 'name' => 'Bell Pepper',        'base_unit' => 'pcs',    'category' => 'Produce'],
            ['code' => 'RM-020', 'name' => 'Tomato',             'base_unit' => 'pcs',    'category' => 'Produce'],
            ['code' => 'RM-021', 'name' => 'Lime',               'base_unit' => 'pcs',    'category' => 'Produce'],
            ['code' => 'RM-022', 'name' => 'Lemongrass',         'base_unit' => 'pcs',    'category' => 'Produce'],
            ['code' => 'RM-023', 'name' => 'Cornstarch',         'base_unit' => 'cup',    'category' => 'Starch'],
            ['code' => 'RM-024', 'name' => 'Salt',               'base_unit' => 'cup',    'category' => 'Spice'],
            ['code' => 'RM-025', 'name' => 'Black Pepper',       'base_unit' => 'tbsp',   'category' => 'Spice'],
            ['code' => 'RM-026', 'name' => 'Sugar',              'base_unit' => 'cup',    'category' => 'Sweetener'],
            ['code' => 'RM-027', 'name' => 'Vinegar',            'base_unit' => 'cup',    'category' => 'Sauce'],
            ['code' => 'RM-028', 'name' => 'Hoisin Sauce',       'base_unit' => 'bottle', 'category' => 'Sauce'],
            ['code' => 'RM-029', 'name' => 'Chili Flakes',       'base_unit' => 'tbsp',   'category' => 'Spice'],
            ['code' => 'RM-030', 'name' => 'Beef Chuck',         'base_unit' => 'lb',     'category' => 'Protein'],
        ];

        $createdMaterials = [];
        foreach ($materials as $mat) {
            $createdMaterials[$mat['code']] = RawMaterial::create($mat);
        }

        // ─── Prices ─────────────────────────────────────────────────
        $prices = [
            ['code' => 'RM-001', 'vendor' => 'Restaurant Depot', 'unit' => 'can',    'price' => 6.58],
            ['code' => 'RM-002', 'vendor' => 'Costco',           'unit' => 'bottle', 'price' => 4.29],
            ['code' => 'RM-003', 'vendor' => 'Costco',           'unit' => 'cup',    'price' => 0.50],
            ['code' => 'RM-004', 'vendor' => 'Restaurant Depot', 'unit' => 'cup',    'price' => 0.44],
            ['code' => 'RM-005', 'vendor' => 'Costco',           'unit' => 'cup',    'price' => 2.71],
            ['code' => 'RM-006', 'vendor' => 'Local Market',     'unit' => 'cup',    'price' => 2.22],
            ['code' => 'RM-007', 'vendor' => 'Local Market',     'unit' => 'cup',    'price' => 0.45],
            ['code' => 'RM-008', 'vendor' => 'Costco',           'unit' => 'lb',     'price' => 3.49],
            ['code' => 'RM-009', 'vendor' => 'Local Market',     'unit' => 'cup',    'price' => 1.50],
            ['code' => 'RM-010', 'vendor' => 'Costco',           'unit' => 'cup',    'price' => 0.35],
            ['code' => 'RM-011', 'vendor' => 'Restaurant Depot', 'unit' => 'can',    'price' => 5.99],
            ['code' => 'RM-012', 'vendor' => 'Costco',           'unit' => 'lb',     'price' => 2.99],
            ['code' => 'RM-013', 'vendor' => 'Costco',           'unit' => 'lb',     'price' => 0.89],
            ['code' => 'RM-014', 'vendor' => 'Restaurant Depot', 'unit' => 'can',    'price' => 2.49],
            ['code' => 'RM-015', 'vendor' => 'Restaurant Depot', 'unit' => 'bottle', 'price' => 3.99],
            ['code' => 'RM-016', 'vendor' => 'Costco',           'unit' => 'bottle', 'price' => 4.99],
            ['code' => 'RM-017', 'vendor' => 'Local Market',     'unit' => 'cup',    'price' => 1.25],
            ['code' => 'RM-018', 'vendor' => 'Local Market',     'unit' => 'pcs',    'price' => 0.75],
            ['code' => 'RM-019', 'vendor' => 'Local Market',     'unit' => 'pcs',    'price' => 1.25],
            ['code' => 'RM-020', 'vendor' => 'Local Market',     'unit' => 'pcs',    'price' => 0.50],
            ['code' => 'RM-021', 'vendor' => 'Local Market',     'unit' => 'pcs',    'price' => 0.25],
            ['code' => 'RM-022', 'vendor' => 'Local Market',     'unit' => 'pcs',    'price' => 0.50],
            ['code' => 'RM-023', 'vendor' => 'Costco',           'unit' => 'cup',    'price' => 0.30],
            ['code' => 'RM-024', 'vendor' => 'Costco',           'unit' => 'cup',    'price' => 0.15],
            ['code' => 'RM-025', 'vendor' => 'Costco',           'unit' => 'tbsp',   'price' => 0.20],
            ['code' => 'RM-026', 'vendor' => 'Costco',           'unit' => 'cup',    'price' => 0.40],
            ['code' => 'RM-027', 'vendor' => 'Costco',           'unit' => 'cup',    'price' => 0.55],
            ['code' => 'RM-028', 'vendor' => 'Restaurant Depot', 'unit' => 'bottle', 'price' => 3.79],
            ['code' => 'RM-029', 'vendor' => 'Restaurant Depot', 'unit' => 'tbsp',   'price' => 0.15],
            ['code' => 'RM-030', 'vendor' => 'Costco',           'unit' => 'lb',     'price' => 5.99],
        ];

        foreach ($prices as $p) {
            RawMaterialPrice::create([
                'raw_material_id' => $createdMaterials[$p['code']]->id,
                'vendor_name' => $p['vendor'],
                'unit' => $p['unit'],
                'unit_price' => $p['price'],
                'effective_date' => now()->toDateString(),
                'source' => 'manual',
                'active' => true,
            ]);
        }

        // ─── Unit Conversions ────────────────────────────────────────
        $conversions = [
            ['from_unit' => 'L',      'to_unit' => 'cup',    'multiplier' => 4.22675, 'notes' => '1 liter = ~4.22 cups'],
            ['from_unit' => 'L',      'to_unit' => 'mL',     'multiplier' => 1000,    'notes' => null],
            ['from_unit' => 'cup',    'to_unit' => 'mL',     'multiplier' => 236.588, 'notes' => null],
            ['from_unit' => 'cup',    'to_unit' => 'tbsp',   'multiplier' => 16,      'notes' => null],
            ['from_unit' => 'tbsp',   'to_unit' => 'tsp',    'multiplier' => 3,       'notes' => null],
            ['from_unit' => 'lb',     'to_unit' => 'oz',     'multiplier' => 16,      'notes' => null],
            ['from_unit' => 'lb',     'to_unit' => 'kg',     'multiplier' => 0.453592,'notes' => null],
            ['from_unit' => 'kg',     'to_unit' => 'g',      'multiplier' => 1000,    'notes' => null],
            ['from_unit' => 'gallon', 'to_unit' => 'L',      'multiplier' => 3.78541, 'notes' => null],
            ['from_unit' => 'gallon', 'to_unit' => 'cup',    'multiplier' => 16,      'notes' => null],
        ];

        foreach ($conversions as $c) {
            UnitConversion::create($c);
        }

        // ─── Sample Recipe: BBQ Sauce ────────────────────────────────
        // Find or create the BBQ Sauce item
        $bbqItem = Item::where('name', 'like', '%BBQ%')->first();
        if (!$bbqItem) {
            $bbqItem = Item::create([
                'code' => 'ITM-BBQ',
                'name' => 'BBQ Sauce',
                'unit' => 'L',
                'category' => 'Food',
                'active' => true,
            ]);
        }

        $recipe = Recipe::create([
            'item_id' => $bbqItem->id,
            'name' => 'BBQ Sauce - Standard Batch',
            'version' => 1,
            'output_qty' => 6,
            'output_unit' => 'L',
            'labor_hours' => 2,
            'labor_rate' => 16.00,
            'waste_percent' => 0,
            'markup_percent' => 30,
            'active' => true,
            'notes' => 'Standard BBQ Sauce batch recipe - yields 6 liters',
        ]);

        // BBQ Sauce recipe lines
        $recipeLines = [
            ['code' => 'RM-001', 'qty' => 1,    'unit' => 'can'],    // Oyster Sauce - $6.58
            ['code' => 'RM-002', 'qty' => 3,    'unit' => 'bottle'], // Sweet Chili - 3 x $4.29 = $12.87
            ['code' => 'RM-003', 'qty' => 2,    'unit' => 'cup'],    // Brown Sugar - 2 x $0.50 = $1.00
            ['code' => 'RM-004', 'qty' => 3,    'unit' => 'cup'],    // Soy Sauce - 3 x $0.44 = $1.32
            ['code' => 'RM-005', 'qty' => 1,    'unit' => 'cup'],    // Sesame Oil - $2.71
            ['code' => 'RM-006', 'qty' => 1,    'unit' => 'cup'],    // Green Onion - $2.22
            ['code' => 'RM-007', 'qty' => 1,    'unit' => 'cup'],    // Cilantro - $0.45
        ];

        // Total ingredient cost: 6.58 + 12.87 + 1.00 + 1.32 + 2.71 + 2.22 + 0.45 = $27.15
        // Labor: 2h x $16 = $32.00
        // Waste: 0%
        // Subtotal: $27.15 + $32.00 = $59.15
        // Markup 30%: $59.15 x 0.30 = $17.75
        // Final: $59.15 + $17.75 = $76.90
        // Cost per unit (6L): $76.90 / 6 = $12.82/L

        foreach ($recipeLines as $i => $line) {
            RecipeLine::create([
                'recipe_id' => $recipe->id,
                'raw_material_id' => $createdMaterials[$line['code']]->id,
                'qty_required' => $line['qty'],
                'unit' => $line['unit'],
                'sort_order' => $i,
            ]);
        }
    }
}
