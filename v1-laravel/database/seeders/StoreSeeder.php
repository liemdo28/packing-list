<?php

namespace Database\Seeders;

use App\Models\Store;
use Illuminate\Database\Seeder;

class StoreSeeder extends Seeder
{
    public function run(): void
    {
        Store::create(['code' => 'B1', 'name' => 'THE RIM', 'address' => '17619 La Cantera Pkwy UNIT 208, San Antonio, TX', 'phone' => '(210) 257-8080']);
        Store::create(['code' => 'B2', 'name' => 'STONE OAK', 'address' => '22506 U.S. Hwy 281 N Ste 106, San Antonio, TX', 'phone' => '(210) 437-0632']);
        Store::create(['code' => 'B3', 'name' => 'BANDERA', 'address' => '11309 Bandera Rd Ste 111, San Antonio, TX', 'phone' => '(210) 277-7740']);
    }
}
