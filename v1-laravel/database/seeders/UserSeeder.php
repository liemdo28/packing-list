<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Store;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $b1 = Store::where('code', 'B1')->first();
        $b2 = Store::where('code', 'B2')->first();
        $b3 = Store::where('code', 'B3')->first();

        User::create(['name' => 'Admin', 'email' => 'admin@packinglist.com', 'password' => Hash::make('password'), 'role' => 'admin', 'store_id' => null]);
        User::create(['name' => 'B1 Manager', 'email' => 'b1@packinglist.com', 'password' => Hash::make('password'), 'role' => 'b1', 'store_id' => $b1->id]);
        User::create(['name' => 'B2 Manager', 'email' => 'b2@packinglist.com', 'password' => Hash::make('password'), 'role' => 'b2', 'store_id' => $b2->id]);
        User::create(['name' => 'B3 Manager', 'email' => 'b3@packinglist.com', 'password' => Hash::make('password'), 'role' => 'b3', 'store_id' => $b3->id]);
        User::create(['name' => 'Accountant', 'email' => 'accountant@packinglist.com', 'password' => Hash::make('password'), 'role' => 'accountant', 'store_id' => null]);
    }
}
