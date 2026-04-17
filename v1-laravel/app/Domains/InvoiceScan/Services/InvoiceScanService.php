<?php

namespace App\Domains\InvoiceScan\Services;

use App\Domains\CostEngine\Models\RawMaterial;
use App\Domains\CostEngine\Models\RawMaterialPrice;
use App\Domains\InvoiceScan\Models\ScanJob;
use App\Domains\InvoiceScan\Models\ScanJobFile;
use App\Domains\InvoiceScan\Models\ScanJobPriceUpdate;
use App\Domains\InvoiceScan\Models\Vendor;
use App\Domains\InvoiceScan\Models\VendorItemMapping;
use Carbon\Carbon;
use Illuminate\Support\Str;

class InvoiceScanService
{
    /**
     * Simulated invoice items for demo purposes.
     */
    private array $demoItems = [
        'Four Season' => [
            ['name' => 'Chashu Pork Belly', 'unit' => 'lb', 'price' => 5.49],
            ['name' => 'Tonkotsu Broth Base', 'unit' => 'gal', 'price' => 12.99],
            ['name' => 'Ramen Noodles (Fresh)', 'unit' => 'cs', 'price' => 24.50],
            ['name' => 'Soft Boiled Eggs', 'unit' => 'dz', 'price' => 3.89],
            ['name' => 'Green Onion', 'unit' => 'bunch', 'price' => 0.79],
            ['name' => 'Nori Seaweed Sheets', 'unit' => 'pk', 'price' => 8.50],
            ['name' => 'White Miso Paste', 'unit' => 'lb', 'price' => 6.25],
            ['name' => 'Sesame Oil', 'unit' => 'btl', 'price' => 7.99],
            ['name' => 'Bamboo Shoots', 'unit' => 'can', 'price' => 3.15],
            ['name' => 'Corn Kernels', 'unit' => 'can', 'price' => 1.89],
            ['name' => 'Wood Ear Mushroom', 'unit' => 'lb', 'price' => 9.75],
            ['name' => 'Soy Sauce (Bulk)', 'unit' => 'gal', 'price' => 8.50],
        ],
        'Meat Vendor' => [
            ['name' => 'Ground Pork', 'unit' => 'lb', 'price' => 3.99],
            ['name' => 'Pork Belly Slab', 'unit' => 'lb', 'price' => 5.29],
            ['name' => 'Chicken Thigh Boneless', 'unit' => 'lb', 'price' => 2.89],
            ['name' => 'Pork Bone (Femur)', 'unit' => 'lb', 'price' => 1.49],
            ['name' => 'Bacon Sliced', 'unit' => 'lb', 'price' => 6.99],
            ['name' => 'Wagyu Beef Slices', 'unit' => 'lb', 'price' => 28.50],
            ['name' => 'Duck Breast', 'unit' => 'lb', 'price' => 12.99],
            ['name' => 'Pork Loin', 'unit' => 'lb', 'price' => 4.25],
        ],
        'Produce Vendor' => [
            ['name' => 'Bean Sprouts', 'unit' => 'lb', 'price' => 1.25],
            ['name' => 'Bok Choy', 'unit' => 'lb', 'price' => 1.99],
            ['name' => 'Fresh Ginger Root', 'unit' => 'lb', 'price' => 3.49],
            ['name' => 'Garlic Bulbs', 'unit' => 'lb', 'price' => 2.99],
            ['name' => 'Shiitake Mushrooms', 'unit' => 'lb', 'price' => 7.99],
            ['name' => 'Thai Chili Peppers', 'unit' => 'lb', 'price' => 4.50],
            ['name' => 'Cilantro', 'unit' => 'bunch', 'price' => 0.89],
            ['name' => 'Lime', 'unit' => 'each', 'price' => 0.35],
            ['name' => 'Cabbage Napa', 'unit' => 'head', 'price' => 2.49],
            ['name' => 'Spinach Baby', 'unit' => 'lb', 'price' => 3.99],
        ],
        'Ramen Support' => [
            ['name' => 'Takeout Container 32oz', 'unit' => 'cs', 'price' => 45.00],
            ['name' => 'Chopstick Bamboo Wrap', 'unit' => 'cs', 'price' => 18.50],
            ['name' => 'Soup Spoon Plastic', 'unit' => 'cs', 'price' => 22.00],
            ['name' => 'Napkins 2-Ply', 'unit' => 'cs', 'price' => 32.00],
            ['name' => 'Rayu Chili Oil', 'unit' => 'btl', 'price' => 9.99],
            ['name' => 'Mayu Black Garlic Oil', 'unit' => 'btl', 'price' => 11.50],
        ],
    ];

    public function createScanJob(int $userId, int $month, int $year, ?int $vendorId = null): ScanJob
    {
        return ScanJob::create([
            'requested_by' => $userId,
            'month' => $month,
            'year' => $year,
            'vendor_id' => $vendorId,
            'status' => 'pending',
        ]);
    }

    public function processScanJob(ScanJob $scanJob): void
    {
        $scanJob->update([
            'status' => 'processing',
            'started_at' => now(),
        ]);

        try {
            $vendors = $scanJob->vendor_id
                ? Vendor::where('id', $scanJob->vendor_id)->get()
                : Vendor::active()->get();

            if ($vendors->isEmpty()) {
                $scanJob->update([
                    'status' => 'failed',
                    'finished_at' => now(),
                    'error_message' => 'No vendors found to scan.',
                ]);
                return;
            }

            $totalFiles = 0;
            $parsedFiles = 0;
            $failedFiles = 0;

            foreach ($vendors as $vendor) {
                $files = $this->simulateFileScan($scanJob, $vendor);
                $totalFiles += count($files);

                foreach ($files as $file) {
                    if ($file->parse_status === 'success') {
                        $parsedFiles++;
                    } else {
                        $failedFiles++;
                    }
                }
            }

            // Match items and update prices
            $this->matchItems($scanJob);
            $this->updatePrices($scanJob);

            // Calculate stats
            $matchedItems = $scanJob->priceUpdates()->whereIn('action', ['updated', 'kept'])->count();
            $updatedPrices = $scanJob->priceUpdates()->where('action', 'updated')->count();
            $keptOldPrices = $scanJob->priceUpdates()->where('action', 'kept')->count();

            $scanJob->update([
                'status' => 'completed',
                'total_files' => $totalFiles,
                'parsed_files' => $parsedFiles,
                'failed_files' => $failedFiles,
                'matched_items' => $matchedItems,
                'updated_prices' => $updatedPrices,
                'kept_old_prices' => $keptOldPrices,
                'finished_at' => now(),
            ]);
        } catch (\Exception $e) {
            $scanJob->update([
                'status' => 'failed',
                'finished_at' => now(),
                'error_message' => $e->getMessage(),
            ]);
        }
    }

    private function simulateFileScan(ScanJob $scanJob, Vendor $vendor): array
    {
        $vendorName = $vendor->name;
        $items = $this->demoItems[$vendorName] ?? $this->demoItems['Four Season'];
        $monthStr = str_pad($scanJob->month, 2, '0', STR_PAD_LEFT);
        $yearStr = $scanJob->year;

        $files = [];
        $fileCount = rand(2, 4);

        for ($i = 1; $i <= $fileCount; $i++) {
            $invoiceDay = rand(1, 28);
            $dayStr = str_pad($invoiceDay, 2, '0', STR_PAD_LEFT);
            $invoiceNum = strtoupper(Str::substr($vendor->code, 0, 3)) . "-{$yearStr}{$monthStr}-" . str_pad($i, 3, '0', STR_PAD_LEFT);

            $isFailed = ($i === $fileCount && rand(1, 5) === 1); // 20% chance last file fails

            $file = ScanJobFile::create([
                'scan_job_id' => $scanJob->id,
                'file_name' => "{$vendor->code}_invoice_{$yearStr}{$monthStr}{$dayStr}_{$i}.pdf",
                'file_type' => 'pdf',
                'file_url' => "https://drive.google.com/file/d/simulated_{$scanJob->id}_{$vendor->id}_{$i}",
                'parse_status' => $isFailed ? 'failed' : 'success',
                'vendor_name_parsed' => $isFailed ? null : $vendorName,
                'invoice_number_parsed' => $isFailed ? null : $invoiceNum,
                'invoice_date_parsed' => $isFailed ? null : Carbon::create($yearStr, $scanJob->month, $invoiceDay),
                'error_message' => $isFailed ? 'Unable to parse PDF: corrupted file' : null,
            ]);

            if (!$isFailed) {
                // Generate price updates for items in this file
                $itemsPerFile = array_slice($items, 0, rand(3, min(6, count($items))));
                $items = array_slice($items, count($itemsPerFile)); // rotate items
                if (empty($items)) {
                    $items = $this->demoItems[$vendorName] ?? $this->demoItems['Four Season'];
                }

                foreach ($itemsPerFile as $item) {
                    // Slight price variation
                    $priceVariation = $item['price'] * (1 + (rand(-5, 8) / 100));
                    $newPrice = round($priceVariation, 2);

                    ScanJobPriceUpdate::create([
                        'scan_job_id' => $scanJob->id,
                        'scan_job_file_id' => $file->id,
                        'raw_item_name' => $item['name'],
                        'unit' => $item['unit'],
                        'new_price' => $newPrice,
                        'action' => 'unmatched', // will be updated during matching
                    ]);
                }
            }

            $files[] = $file;
        }

        return $files;
    }

    public function matchItems(ScanJob $scanJob): void
    {
        $priceUpdates = $scanJob->priceUpdates()->where('action', 'unmatched')->get();
        $rawMaterials = RawMaterial::active()->get();

        foreach ($priceUpdates as $update) {
            $normalizedName = $this->normalizeName($update->raw_item_name);

            // Check existing vendor item mappings
            $mapping = VendorItemMapping::where('normalized_name', $normalizedName)
                ->where('match_status', 'matched')
                ->first();

            if ($mapping && $mapping->raw_material_id) {
                $update->update([
                    'raw_material_id' => $mapping->raw_material_id,
                    'action' => 'kept', // temporary, will be updated in updatePrices
                ]);
                continue;
            }

            // Try exact match on raw material name
            $exactMatch = $rawMaterials->first(function ($rm) use ($normalizedName) {
                return $this->normalizeName($rm->name) === $normalizedName;
            });

            if ($exactMatch) {
                $this->createOrUpdateMapping($scanJob->vendor_id, $update->raw_item_name, $normalizedName, $exactMatch->id, 'matched');
                $update->update([
                    'raw_material_id' => $exactMatch->id,
                    'action' => 'kept',
                ]);
                continue;
            }

            // Try fuzzy match
            $bestMatch = null;
            $bestScore = 0;

            foreach ($rawMaterials as $rm) {
                $rmNormalized = $this->normalizeName($rm->name);
                similar_text($normalizedName, $rmNormalized, $score);

                if ($score > $bestScore && $score >= 60) {
                    $bestScore = $score;
                    $bestMatch = $rm;
                }
            }

            if ($bestMatch && $bestScore >= 75) {
                $this->createOrUpdateMapping($scanJob->vendor_id, $update->raw_item_name, $normalizedName, $bestMatch->id, 'matched');
                $update->update([
                    'raw_material_id' => $bestMatch->id,
                    'action' => 'kept',
                ]);
            } else {
                // Create pending mapping for review
                $this->createOrUpdateMapping($scanJob->vendor_id, $update->raw_item_name, $normalizedName, $bestMatch?->id, 'pending');
                $update->update([
                    'action' => 'unmatched',
                    'notes' => $bestMatch ? "Suggested: {$bestMatch->name} ({$bestScore}%)" : 'No match found',
                ]);
            }
        }
    }

    public function updatePrices(ScanJob $scanJob): void
    {
        $matchedUpdates = $scanJob->priceUpdates()
            ->whereNotNull('raw_material_id')
            ->where('action', '!=', 'unmatched')
            ->get();

        foreach ($matchedUpdates as $update) {
            $rawMaterial = RawMaterial::find($update->raw_material_id);
            if (!$rawMaterial) {
                $update->update(['action' => 'skipped', 'notes' => 'Raw material not found']);
                continue;
            }

            $currentPrice = $rawMaterial->getCurrentPrice();
            $update->old_price = $currentPrice;

            if ($update->new_price && $update->new_price != $currentPrice) {
                // Create new price record (preserving history)
                RawMaterialPrice::create([
                    'raw_material_id' => $rawMaterial->id,
                    'vendor_name' => $update->scanJobFile?->vendor_name_parsed ?? 'Invoice Scan',
                    'unit' => $update->unit ?? $rawMaterial->base_unit,
                    'unit_price' => $update->new_price,
                    'effective_date' => $update->scanJobFile?->invoice_date_parsed ?? now(),
                    'source' => 'invoice',
                    'active' => true,
                ]);

                $update->update([
                    'old_price' => $currentPrice,
                    'action' => 'updated',
                    'notes' => 'Price updated from invoice scan',
                ]);
            } else {
                $update->update([
                    'old_price' => $currentPrice,
                    'action' => 'kept',
                    'notes' => 'Price unchanged',
                ]);
            }
        }
    }

    private function normalizeName(string $name): string
    {
        $name = strtolower(trim($name));
        $name = preg_replace('/[^a-z0-9\s]/', '', $name);
        $name = preg_replace('/\s+/', ' ', $name);
        return $name;
    }

    private function createOrUpdateMapping(?int $vendorId, string $vendorItemName, string $normalizedName, ?int $rawMaterialId, string $status): void
    {
        VendorItemMapping::updateOrCreate(
            [
                'vendor_id' => $vendorId ?? 0,
                'normalized_name' => $normalizedName,
            ],
            [
                'vendor_item_name' => $vendorItemName,
                'raw_material_id' => $rawMaterialId,
                'match_status' => $status,
            ]
        );
    }
}
