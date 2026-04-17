<?php

namespace App\Domains\Inventory\Http\Controllers;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Services\InventoryService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ItemController extends Controller
{
    public function __construct(protected InventoryService $inventoryService) {}

    public function index(Request $request)
    {
        $query = Item::query();
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }
        $items = $query->orderBy('code')->paginate(20)->withQueryString();
        $categories = config('packinglist.categories');
        return Inertia::render('Items/Index', compact('items', 'categories'));
    }

    public function create()
    {
        $units = config('packinglist.units');
        $categories = config('packinglist.categories');
        return Inertia::render('Items/Create', compact('units', 'categories'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:20|unique:items',
            'name' => 'required|string|max:150',
            'unit' => 'required|string|max:20',
            'category' => 'nullable|string|max:50',
        ]);

        $this->inventoryService->createItem($data);
        return redirect()->route('items.index')->with('success', 'Item created successfully.');
    }

    public function edit(Item $item)
    {
        $units = config('packinglist.units');
        $categories = config('packinglist.categories');
        return Inertia::render('Items/Edit', compact('item', 'units', 'categories'));
    }

    public function update(Request $request, Item $item)
    {
        $data = $request->validate([
            'code' => 'required|string|max:20|unique:items,code,' . $item->id,
            'name' => 'required|string|max:150',
            'unit' => 'required|string|max:20',
            'category' => 'nullable|string|max:50',
            'active' => 'boolean',
        ]);

        $this->inventoryService->updateItem($item, $data);
        return redirect()->route('items.index')->with('success', 'Item updated successfully.');
    }

    public function destroy(Item $item)
    {
        $this->inventoryService->deactivateItem($item);
        return redirect()->route('items.index')->with('success', 'Item deactivated.');
    }
}
