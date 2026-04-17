<?php

namespace App\Domains\InvoiceScan\Http\Controllers;

use App\Domains\InvoiceScan\Models\GoogleDriveConfig;
use App\Domains\CostEngine\Models\RawMaterial;
use App\Domains\InvoiceScan\Models\ScanJob;
use App\Domains\User\Models\Store;
use App\Domains\InvoiceScan\Models\Vendor;
use App\Domains\InvoiceScan\Models\VendorItemMapping;
use App\Domains\InvoiceScan\Services\InvoiceScanService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceScanController extends Controller
{
    public function __construct(
        private InvoiceScanService $scanService
    ) {}

    public function index()
    {
        $vendors = Vendor::active()->orderBy('name')->get();
        $driveConfigs = GoogleDriveConfig::with('vendor', 'store')
            ->where('active', true)
            ->orderBy('created_at', 'desc')
            ->get();

        $recentScans = ScanJob::with('requestedBy', 'vendor')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return Inertia::render('InvoiceScan/Index', [
            'vendors' => $vendors,
            'driveConfigs' => $driveConfigs,
            'recentScans' => $recentScans,
        ]);
    }

    public function configs()
    {
        $configs = GoogleDriveConfig::with('vendor', 'store', 'createdBy')
            ->orderByDesc('created_at')
            ->get();

        $vendors = Vendor::active()->orderBy('name')->get();
        $stores = Store::active()->orderBy('name')->get();

        return Inertia::render('InvoiceScan/Configs', [
            'configs' => $configs,
            'vendors' => $vendors,
            'stores' => $stores,
        ]);
    }

    public function storeConfig(Request $request)
    {
        $data = $request->validate([
            'vendor_id' => 'nullable|exists:vendors,id',
            'store_id' => 'nullable|exists:stores,id',
            'folder_id' => 'required|string|max:255',
            'folder_name' => 'required|string|max:255',
            'folder_url' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        $data['created_by'] = $request->user()->id;
        $data['active'] = true;

        GoogleDriveConfig::create($data);

        return redirect()->route('invoice-scan.configs')->with('success', 'Folder mapping created successfully.');
    }

    public function scan(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2030',
            'vendor_id' => 'nullable|exists:vendors,id',
        ]);

        $scanJob = $this->scanService->createScanJob(
            $request->user()->id,
            $request->month,
            $request->year,
            $request->vendor_id
        );

        $this->scanService->processScanJob($scanJob);

        return redirect()->route('invoice-scan.results', $scanJob)
            ->with('success', 'Invoice scan completed.');
    }

    public function results(ScanJob $scanJob)
    {
        $scanJob->load(['requestedBy', 'vendor', 'files', 'priceUpdates.rawMaterial', 'priceUpdates.scanJobFile']);

        return Inertia::render('InvoiceScan/Results', [
            'scanJob' => $scanJob,
        ]);
    }

    public function review(ScanJob $scanJob)
    {
        $scanJob->load(['vendor', 'priceUpdates.scanJobFile']);

        $unmatchedItems = $scanJob->priceUpdates()
            ->where('action', 'unmatched')
            ->get();

        $rawMaterials = RawMaterial::active()->orderBy('name')->get();

        return Inertia::render('InvoiceScan/Review', [
            'scanJob' => $scanJob,
            'unmatchedItems' => $unmatchedItems,
            'rawMaterials' => $rawMaterials,
        ]);
    }

    public function mapItem(Request $request)
    {
        $request->validate([
            'price_update_id' => 'required|exists:scan_job_price_updates,id',
            'raw_material_id' => 'required|exists:raw_materials,id',
        ]);

        $priceUpdate = \App\Domains\InvoiceScan\Models\ScanJobPriceUpdate::findOrFail($request->price_update_id);
        $rawMaterial = RawMaterial::findOrFail($request->raw_material_id);

        // Update the price update record
        $priceUpdate->update([
            'raw_material_id' => $rawMaterial->id,
            'action' => 'updated',
            'notes' => 'Manually mapped by user',
        ]);

        // Create or update vendor item mapping
        $normalizedName = strtolower(trim(preg_replace('/\s+/', ' ', preg_replace('/[^a-z0-9\s]/', '', strtolower($priceUpdate->raw_item_name)))));

        VendorItemMapping::updateOrCreate(
            [
                'vendor_id' => $priceUpdate->scanJob->vendor_id ?? 0,
                'normalized_name' => $normalizedName,
            ],
            [
                'vendor_item_name' => $priceUpdate->raw_item_name,
                'raw_material_id' => $rawMaterial->id,
                'match_status' => 'matched',
            ]
        );

        // Create price record
        \App\Domains\CostEngine\Models\RawMaterialPrice::create([
            'raw_material_id' => $rawMaterial->id,
            'vendor_name' => $priceUpdate->scanJobFile?->vendor_name_parsed ?? 'Invoice Scan',
            'unit' => $priceUpdate->unit ?? $rawMaterial->base_unit,
            'unit_price' => $priceUpdate->new_price,
            'effective_date' => $priceUpdate->scanJobFile?->invoice_date_parsed ?? now(),
            'source' => 'invoice',
            'active' => true,
        ]);

        return redirect()->back()->with('success', "Mapped '{$priceUpdate->raw_item_name}' to '{$rawMaterial->name}'.");
    }
}
