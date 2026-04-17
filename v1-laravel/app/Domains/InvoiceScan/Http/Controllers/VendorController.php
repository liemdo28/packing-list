<?php

namespace App\Domains\InvoiceScan\Http\Controllers;

use App\Domains\InvoiceScan\Models\Vendor;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VendorController extends Controller
{
    public function index()
    {
        $vendors = Vendor::withCount('vendorItemMappings', 'googleDriveConfigs')
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('Vendors/Index', [
            'vendors' => $vendors,
        ]);
    }

    public function create()
    {
        return Inertia::render('Vendors/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:20|unique:vendors',
            'name' => 'required|string|max:150',
            'active' => 'boolean',
        ]);

        Vendor::create($data);

        return redirect()->route('vendors.index')->with('success', 'Vendor created successfully.');
    }

    public function edit(Vendor $vendor)
    {
        return Inertia::render('Vendors/Edit', [
            'vendor' => $vendor,
        ]);
    }

    public function update(Request $request, Vendor $vendor)
    {
        $data = $request->validate([
            'code' => 'required|string|max:20|unique:vendors,code,' . $vendor->id,
            'name' => 'required|string|max:150',
            'active' => 'boolean',
        ]);

        $vendor->update($data);

        return redirect()->route('vendors.index')->with('success', 'Vendor updated successfully.');
    }
}
