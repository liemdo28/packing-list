<?php

namespace Database\Seeders;

use App\Models\GoogleDriveConfig;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorItemMapping;
use App\Models\RawMaterial;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = [
            ['code' => 'FS', 'name' => 'Four Season', 'active' => true],
            ['code' => 'MV', 'name' => 'Meat Vendor', 'active' => true],
            ['code' => 'PV', 'name' => 'Produce Vendor', 'active' => true],
            ['code' => 'RS', 'name' => 'Ramen Support', 'active' => true],
        ];

        foreach ($vendors as $vendorData) {
            Vendor::firstOrCreate(['code' => $vendorData['code']], $vendorData);
        }

        // Create sample Google Drive configs
        $adminUser = User::where('role', 'admin')->first();
        if ($adminUser) {
            $fourSeason = Vendor::where('code', 'FS')->first();
            $meatVendor = Vendor::where('code', 'MV')->first();
            $produceVendor = Vendor::where('code', 'PV')->first();
            $ramenSupport = Vendor::where('code', 'RS')->first();

            $configs = [
                [
                    'vendor_id' => $fourSeason?->id,
                    'folder_id' => '1aBcDeFgHiJkLmNoPqRsT_FourSeason',
                    'folder_name' => 'Four Season Invoices 2024',
                    'folder_url' => 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsT_FourSeason',
                    'notes' => 'Main supplier - monthly invoices',
                ],
                [
                    'vendor_id' => $meatVendor?->id,
                    'folder_id' => '1xYzAbCdEfGhIjKlMnOp_MeatVendor',
                    'folder_name' => 'Meat Vendor Invoices',
                    'folder_url' => 'https://drive.google.com/drive/folders/1xYzAbCdEfGhIjKlMnOp_MeatVendor',
                    'notes' => 'Weekly delivery invoices',
                ],
                [
                    'vendor_id' => $produceVendor?->id,
                    'folder_id' => '1QrStUvWxYz0123456789_ProduceVendor',
                    'folder_name' => 'Produce Vendor Invoices',
                    'folder_url' => 'https://drive.google.com/drive/folders/1QrStUvWxYz0123456789_ProduceVendor',
                    'notes' => 'Fresh produce deliveries',
                ],
                [
                    'vendor_id' => $ramenSupport?->id,
                    'folder_id' => '1MnOpQrStUvWxYz012345_RamenSupport',
                    'folder_name' => 'Ramen Support Supplies',
                    'folder_url' => 'https://drive.google.com/drive/folders/1MnOpQrStUvWxYz012345_RamenSupport',
                    'notes' => 'Packaging and specialty items',
                ],
            ];

            foreach ($configs as $configData) {
                GoogleDriveConfig::firstOrCreate(
                    ['folder_id' => $configData['folder_id']],
                    array_merge($configData, [
                        'created_by' => $adminUser->id,
                        'active' => true,
                    ])
                );
            }
        }

        // Create sample vendor item mappings if raw materials exist
        $rawMaterials = RawMaterial::all();
        if ($rawMaterials->isNotEmpty()) {
            $fourSeason = Vendor::where('code', 'FS')->first();
            if ($fourSeason) {
                $sampleMappings = [
                    ['vendor_item_name' => 'Chashu Pork Belly', 'normalized_name' => 'chashu pork belly'],
                    ['vendor_item_name' => 'Tonkotsu Broth Base', 'normalized_name' => 'tonkotsu broth base'],
                    ['vendor_item_name' => 'Ramen Noodles (Fresh)', 'normalized_name' => 'ramen noodles fresh'],
                ];

                foreach ($sampleMappings as $mapping) {
                    // Try to find a matching raw material
                    $rm = $rawMaterials->first(function ($r) use ($mapping) {
                        return stripos($r->name, explode(' ', $mapping['vendor_item_name'])[0]) !== false;
                    });

                    VendorItemMapping::firstOrCreate(
                        [
                            'vendor_id' => $fourSeason->id,
                            'normalized_name' => $mapping['normalized_name'],
                        ],
                        [
                            'vendor_item_name' => $mapping['vendor_item_name'],
                            'raw_material_id' => $rm?->id,
                            'match_status' => $rm ? 'matched' : 'pending',
                        ]
                    );
                }
            }
        }
    }
}
