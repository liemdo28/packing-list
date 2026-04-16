<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\PriceMaster;
use App\Models\User;
use Illuminate\Database\Seeder;

class PriceSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();
        $prices = [
            'ITM001' => 27.26, 'ITM002' => 68.02, 'ITM003' => 76.91, 'ITM004' => 38.50,
            'ITM005' => 7.84, 'ITM006' => 50.00, 'ITM007' => 36.28, 'ITM008' => 3.90,
            'ITM009' => 68.50, 'ITM010' => 3.45, 'ITM011' => 28.37, 'ITM012' => 42.04,
            'ITM013' => 18.12, 'ITM014' => 100.62, 'ITM015' => 18.12, 'ITM016' => 5.54,
            'ITM017' => 183.16, 'ITM018' => 52.20, 'ITM019' => 4.20, 'ITM020' => 81.25,
            'ITM021' => 93.26, 'ITM022' => 132.00, 'ITM023' => 100.29, 'ITM024' => 36.95,
            'ITM025' => 112.60, 'ITM026' => 34.65, 'ITM027' => 156.00, 'ITM028' => 61.24,
            'ITM029' => 42.00, 'ITM030' => 47.29, 'ITM031' => 42.93, 'ITM032' => 27.74,
            'ITM033' => 50.27, 'ITM034' => 179.00, 'ITM035' => 19.98, 'ITM036' => 34.40,
            'ITM037' => 257.31, 'ITM038' => 39.66, 'ITM039' => 20.00, 'ITM040' => 33.28,
            'ITM041' => 74.00, 'ITM042' => 2.50, 'ITM043' => 1.00, 'ITM044' => 348.57,
            'ITM045' => 28.62, 'ITM046' => 56.55, 'ITM047' => 33.97, 'ITM048' => 13.72,
            'ITM049' => 36.89, 'ITM050' => 14.95, 'ITM051' => 2.30, 'ITM052' => 25.00,
            'ITM053' => 37.44, 'ITM054' => 183.04, 'ITM055' => 205.40, 'ITM056' => 154.44,
            'ITM057' => 13.10, 'ITM058' => 45.00, 'ITM059' => 42.09, 'ITM060' => 21.28,
            'ITM061' => 73.79, 'ITM062' => 160.17, 'ITM063' => 10.89, 'ITM064' => 25.03,
            'ITM065' => 55.54, 'ITM066' => 131.63, 'ITM067' => 264.55, 'ITM068' => 1.00,
            'ITM069' => 109.21, 'ITM070' => 119.44, 'ITM071' => 253.50, 'ITM072' => 8.59,
            'ITM073' => 28.50, 'ITM074' => 10.00,
        ];

        foreach ($prices as $code => $price) {
            $item = Item::where('code', $code)->first();
            if ($item) {
                PriceMaster::create([
                    'item_id' => $item->id,
                    'price' => $price,
                    'effective_from' => '2026-01-01',
                    'effective_to' => null,
                    'created_by' => $admin->id,
                ]);
            }
        }
    }
}
