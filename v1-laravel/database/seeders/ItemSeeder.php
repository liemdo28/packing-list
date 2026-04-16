<?php

namespace Database\Seeders;

use App\Models\Item;
use Illuminate\Database\Seeder;

class ItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['ITM001', 'Ahi Salad Dressing', '6L', 'Sauce'],
            ['ITM002', 'B-Mix', 'Full Pan', 'Sauce'],
            ['ITM003', 'BBQ Sauce', '6L', 'Sauce'],
            ['ITM004', 'Black Base CS4', 'Sleeve', 'Sauce'],
            ['ITM005', 'Black Garlic', 'Bag', 'Ingredient'],
            ['ITM006', 'Bulgogi Meat', '', 'Meat'],
            ['ITM007', 'Bulgogi Sauce', '6L', 'Sauce'],
            ['ITM008', 'Cabbage Sliced', 'Bag', 'Vegetable'],
            ['ITM009', 'Cacahoate (Peanuts)', 'CS 50lbs', 'Ingredient'],
            ['ITM010', 'Cajun Mix', 'Portion', 'Sauce'],
            ['ITM011', 'Chicken Broth', 'Bag', 'Broth'],
            ['ITM012', 'Chicken Curry', '6L', 'Sauce'],
            ['ITM013', 'Chicken Diced (Picado)', '5 Lbs', 'Meat'],
            ['ITM014', 'Chicken Karage', 'Full Pan', 'Meat'],
            ['ITM015', 'Chicken Sliced', '5 Lbs', 'Meat'],
            ['ITM016', 'Chili Para Pozole', '64oz', 'Sauce'],
            ['ITM017', 'Chilli Oil', '15L', 'Sauce'],
            ['ITM018', 'Cilantro Lime Sauce', '6L', 'Sauce'],
            ['ITM019', 'Crunchy Garlic', 'Bottle', 'Ingredient'],
            ['ITM020', 'Crushed Chili', 'Case', 'Ingredient'],
            ['ITM021', 'Eggs Marinate', '20L', 'Ingredient'],
            ['ITM022', 'Farli Paste', 'Box', 'Ingredient'],
            ['ITM023', 'Fish Cake', 'CS', 'Ingredient'],
            ['ITM024', 'Fry Oil', 'EA', 'Supply'],
            ['ITM025', 'Garlic Puree', 'Case', 'Ingredient'],
            ['ITM026', 'Green Onion', 'Pan', 'Vegetable'],
            ['ITM027', 'Garlic Paste Case', 'Case', 'Ingredient'],
            ['ITM028', 'Gyoza Sauce', '6L', 'Sauce'],
            ['ITM029', 'Guantes L', 'CS/10Box', 'Supply'],
            ['ITM030', 'Habanero', '6L', 'Sauce'],
            ['ITM031', 'Honey Sirracha', '6L', 'Sauce'],
            ['ITM032', 'Ichiran', '2L', 'Sauce'],
            ['ITM033', 'Kikurage', 'Full Pan', 'Ingredient'],
            ['ITM034', 'Kombu', 'CS', 'Ingredient'],
            ['ITM035', 'Manzanas', '', 'Ingredient'],
            ['ITM036', 'Mochi', 'Box', 'Ingredient'],
            ['ITM037', 'Miso Paste', '15L', 'Sauce'],
            ['ITM038', 'Mushroom Dried', 'Bag', 'Ingredient'],
            ['ITM039', 'Onion Pickle', '', 'Vegetable'],
            ['ITM040', 'Pepper Smash', '1/6 Pan', 'Sauce'],
            ['ITM041', 'Plastic Kit', '', 'Supply'],
            ['ITM042', 'Ponzole Tare Sauce', 'EA', 'Sauce'],
            ['ITM043', 'Pork Belly', 'No Unit', 'Meat'],
            ['ITM044', 'Pork Belly Sazonador', 'Per L', 'Meat'],
            ['ITM045', 'Pork Broth', 'Bag', 'Broth'],
            ['ITM046', 'Pork For Bun', 'Pan', 'Meat'],
            ['ITM047', 'Pork Katsu', 'Batch', 'Meat'],
            ['ITM048', 'Pork Miso', 'Batch', 'Meat'],
            ['ITM049', 'Pork Sliced for Ramen', '5LB/Pan', 'Meat'],
            ['ITM050', 'Prickly Ash', 'Container', 'Ingredient'],
            ['ITM051', 'Salmon', 'Piece', 'Meat'],
            ['ITM052', 'Salmon Sauce', 'Piece', 'Sauce'],
            ['ITM053', 'Sauce for Katzu Bun', '4L/Batch', 'Sauce'],
            ['ITM054', 'Seasoned Eggs', '20L', 'Ingredient'],
            ['ITM055', 'Sesame Paste', 'Can', 'Sauce'],
            ['ITM056', 'Shio', 'Case', 'Sauce'],
            ['ITM057', 'Shoyu', '6L', 'Sauce'],
            ['ITM058', 'Sesame Dressing', '', 'Sauce'],
            ['ITM059', 'Spicy Citrus', '2L', 'Sauce'],
            ['ITM060', 'Spicy Edamame', '6L', 'Sauce'],
            ['ITM061', 'Spicy Mayo', '6L', 'Sauce'],
            ['ITM062', 'Spicy Paste', '15L', 'Sauce'],
            ['ITM063', 'SYS', 'Per L', 'Sauce'],
            ['ITM064', 'Tan Tan', '3LB', 'Sauce'],
            ['ITM065', 'Tebasaki', '6L', 'Sauce'],
            ['ITM066', 'Tempura Oil', '15L', 'Supply'],
            ['ITM067', 'Tonkotsu', 'CS', 'Broth'],
            ['ITM068', 'Tray Food', 'No Unit', 'Supply'],
            ['ITM069', 'Tuna Mix', 'Batch', 'Meat'],
            ['ITM070', 'Yakitori', '', 'Sauce'],
            ['ITM071', 'Vegan', 'Per L', 'Broth'],
            ['ITM072', 'White Onion Sliced', '8LB', 'Vegetable'],
            ['ITM073', 'Wonton', '', 'Ingredient'],
            ['ITM074', 'Other', '', 'Other'],
        ];

        foreach ($items as [$code, $name, $unit, $category]) {
            Item::create(compact('code', 'name', 'unit', 'category'));
        }
    }
}
