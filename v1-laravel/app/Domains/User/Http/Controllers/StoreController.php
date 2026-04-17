<?php

namespace App\Domains\User\Http\Controllers;

use App\Domains\User\Models\Store;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StoreController extends Controller
{
    public function index()
    {
        $stores = Store::withCount('users')->paginate(20);
        return Inertia::render('Stores/Index', compact('stores'));
    }

    public function create()
    {
        return Inertia::render('Stores/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:10|unique:stores',
            'name' => 'required|string|max:100',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
        ]);

        Store::create($data);
        return redirect()->route('stores.index')->with('success', 'Store created successfully.');
    }

    public function edit(Store $store)
    {
        return Inertia::render('Stores/Edit', compact('store'));
    }

    public function update(Request $request, Store $store)
    {
        $data = $request->validate([
            'code' => 'required|string|max:10|unique:stores,code,' . $store->id,
            'name' => 'required|string|max:100',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'active' => 'boolean',
        ]);

        $store->update($data);
        return redirect()->route('stores.index')->with('success', 'Store updated successfully.');
    }

    public function destroy(Store $store)
    {
        $store->update(['active' => false]);
        return redirect()->route('stores.index')->with('success', 'Store deactivated.');
    }
}
