<?php

namespace App\Http\Controllers;

use App\Models\RawMaterial;
use App\Models\RawMaterialPrice;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RawMaterialController extends Controller
{
    public function index(Request $request)
    {
        $query = RawMaterial::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $materials = $query->orderBy('name')->paginate(20)->withQueryString();

        // Attach latest price to each material
        $materials->getCollection()->transform(function ($material) {
            $latestPrice = $material->latestPrice();
            $material->latest_price = $latestPrice ? (float) $latestPrice->unit_price : null;
            $material->latest_price_unit = $latestPrice ? $latestPrice->unit : null;
            $material->latest_price_date = $latestPrice ? $latestPrice->effective_date->format('Y-m-d') : null;
            $material->latest_vendor = $latestPrice ? $latestPrice->vendor_name : null;
            return $material;
        });

        $categories = RawMaterial::distinct()->pluck('category')->filter()->values();

        return Inertia::render('RawMaterials/Index', [
            'materials' => $materials,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category']),
        ]);
    }

    public function create()
    {
        return Inertia::render('RawMaterials/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:20|unique:raw_materials',
            'name' => 'required|string|max:150',
            'base_unit' => 'required|string|max:20',
            'category' => 'nullable|string|max:50',
        ]);

        RawMaterial::create($data);

        return redirect()->route('raw-materials.index')->with('success', 'Raw material created.');
    }

    public function edit(RawMaterial $rawMaterial)
    {
        return Inertia::render('RawMaterials/Edit', [
            'material' => $rawMaterial,
        ]);
    }

    public function update(Request $request, RawMaterial $rawMaterial)
    {
        $data = $request->validate([
            'code' => 'required|string|max:20|unique:raw_materials,code,' . $rawMaterial->id,
            'name' => 'required|string|max:150',
            'base_unit' => 'required|string|max:20',
            'category' => 'nullable|string|max:50',
            'active' => 'boolean',
        ]);

        $rawMaterial->update($data);

        return redirect()->route('raw-materials.index')->with('success', 'Raw material updated.');
    }

    public function updatePrice(Request $request, RawMaterial $rawMaterial)
    {
        $data = $request->validate([
            'vendor_name' => 'nullable|string|max:100',
            'unit' => 'required|string|max:20',
            'unit_price' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'source' => 'required|in:manual,invoice',
        ]);

        $rawMaterial->prices()->create($data);

        return redirect()->back()->with('success', 'Price updated successfully.');
    }
}
