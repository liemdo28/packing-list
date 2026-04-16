<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\PriceMaster;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PriceMasterController extends Controller
{
    public function index()
    {
        $prices = PriceMaster::with('item', 'creator')
            ->active()
            ->orderBy('item_id')
            ->paginate(20);

        return Inertia::render('Prices/Index', compact('prices'));
    }

    public function create()
    {
        $items = Item::active()->orderBy('name')->get();
        return Inertia::render('Prices/Create', compact('items'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'item_id' => 'required|exists:items,id',
            'price' => 'required|numeric|min:0',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after:effective_from',
        ]);

        // Expire old active price for this item
        PriceMaster::where('item_id', $data['item_id'])
            ->active()
            ->whereNull('effective_to')
            ->update(['effective_to' => $data['effective_from']]);

        $data['created_by'] = auth()->id();
        PriceMaster::create($data);

        return redirect()->route('prices.index')->with('success', 'Price set successfully.');
    }

    public function history(Item $item)
    {
        $prices = PriceMaster::where('item_id', $item->id)
            ->with('creator')
            ->orderByDesc('effective_from')
            ->paginate(20);

        return Inertia::render('Prices/History', compact('item', 'prices'));
    }
}
