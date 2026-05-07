/**
 * Import real items from Google Sheets invoice data.
 * Run: node src/seeders/seed_items_from_sheet.js
 *
 * - Clears existing sample items (and their price_master rows)
 * - Inserts 76 real items with codes, units, categories
 * - Creates price_master entries for items with known prices
 */

require('dotenv').config();
const { sequelize, Item, PriceMaster } = require('../models');

const TODAY = new Date().toISOString().slice(0, 10);

const ITEMS = [
  // Noodles (from B3 only)
  { name: 'Thin Noodle',  unit: 'Bag', category: 'Noodles', price: 0 },
  { name: 'Thick Noodle', unit: 'Bag', category: 'Noodles', price: 0 },

  // Sauces & Dressings
  { name: 'Ahi Salad Dressing',                    unit: '6L',           category: 'Sauces',     price: 29.17  },
  { name: 'BBQ Sauce',                              unit: '6L',           category: 'Sauces',     price: 82.29  },
  { name: 'Bulgogi Sauce',                          unit: '6L',           category: 'Sauces',     price: 38.82  },
  { name: 'Cilantro Lime Sauce',                    unit: '6L',           category: 'Sauces',     price: 55.85  },
  { name: 'Gyoza Sauce',                            unit: '6L',           category: 'Sauces',     price: 65.53  },
  { name: 'Habanero',                               unit: '6L',           category: 'Sauces',     price: 50.60  },
  { name: 'Honey Sirracha',                         unit: '6L',           category: 'Sauces',     price: 45.93  },
  { name: 'Salmon Sauce',                           unit: 'Bottle',       category: 'Sauces',     price: 26.75  },
  { name: 'Sauce for Katzu Bun',                    unit: 'Ea',           category: 'Sauces',     price: 40.06  },
  { name: 'Shoyu',                                  unit: '6L',           category: 'Sauces',     price: 14.02  },
  { name: 'Spicy Citrus',                           unit: 'Ea',           category: 'Sauces',     price: 45.04  },
  { name: 'Spicy Mayo',                             unit: 'Ea',           category: 'Sauces',     price: 78.95  },
  { name: 'Spicy Paste',                            unit: 'Ea',           category: 'Sauces',     price: 171.39 },
  { name: 'Ponzole Tare Sauce',                     unit: 'Ea',           category: 'Sauces',     price: 2.68   },
  { name: 'Sesame Dressing',                        unit: 'Ea',           category: 'Sauces',     price: 48.15  },

  // Proteins
  { name: 'Bulgogi Meat',                           unit: 'Ea',           category: 'Proteins',   price: 53.50  },
  { name: 'Chicken Diced (Picado)',                 unit: '3.2Lb',        category: 'Proteins',   price: 19.39  },
  { name: 'Chicken Karage',                         unit: 'Full Pan',     category: 'Proteins',   price: 107.66 },
  { name: 'Chicken Sliced',                         unit: '5.7Lb',        category: 'Proteins',   price: 19.39  },
  { name: 'Pork Belly',                             unit: 'Ea',           category: 'Proteins',   price: 1.07   },
  { name: 'Pork Belly Sazonador',                   unit: 'Ea',           category: 'Proteins',   price: 372.97 },
  { name: 'Pork For Bun',                           unit: '6.5Lb',        category: 'Proteins',   price: 60.51  },
  { name: 'Pork Katsu for Bun',                     unit: 'Ea',           category: 'Proteins',   price: 36.35  },
  { name: 'Pork Miso',                              unit: '4.75Lb',       category: 'Proteins',   price: 14.68  },
  { name: 'Pork Pozole',                            unit: 'Ea',           category: 'Proteins',   price: 0      },
  { name: 'Pork Sliced for Ramen',                  unit: '5Lb',          category: 'Proteins',   price: 39.48  },
  { name: 'Salmon',                                 unit: 'Ea',           category: 'Proteins',   price: 2.46   },
  { name: 'Tebasaki',                               unit: 'Ea',           category: 'Proteins',   price: 59.42  },
  { name: 'Tuna Mix',                               unit: 'Ea',           category: 'Proteins',   price: 116.86 },
  { name: 'Yakitori',                               unit: 'Ea',           category: 'Proteins',   price: 127.81 },

  // Broth & Base
  { name: 'Chicken Broth',                          unit: 'Ea',           category: 'Broth',      price: 30.35  },
  { name: 'Pork Broth',                             unit: 'Ea',           category: 'Broth',      price: 30.62  },
  { name: 'Miso Paste',                             unit: '15L',          category: 'Broth',      price: 275.32 },
  { name: 'Shio',                                   unit: 'CS',           category: 'Broth',      price: 165.25 },
  { name: 'Tan Tan',                                unit: 'Ea',           category: 'Broth',      price: 26.78  },
  { name: 'Tonkotsu',                               unit: 'Ea',           category: 'Broth',      price: 283.07 },
  { name: 'Ichiran',                                unit: 'L',            category: 'Broth',      price: 29.68  },
  { name: 'Black Base CS4',                         unit: 'Per Sleeve',   category: 'Broth',      price: 41.20  },
  { name: 'Vegan Broth',                            unit: 'Ea',           category: 'Broth',      price: 18.08  },
  { name: 'Chicken Curry',                          unit: '6L',           category: 'Broth',      price: 44.98  },

  // Vegetables
  { name: 'Cabbage Sliced',                         unit: 'Per Head',     category: 'Vegetables', price: 4.17   },
  { name: 'Crunchy Garlic',                         unit: 'Ea',           category: 'Vegetables', price: 4.49   },
  { name: 'Garlic Puree',                           unit: 'Ea',           category: 'Vegetables', price: 120.48 },
  { name: 'Garlic Paste Case',                      unit: 'CS',           category: 'Vegetables', price: 0      },
  { name: 'Green Onion',                            unit: 'Full Pan',     category: 'Vegetables', price: 37.07  },
  { name: 'Manzanas',                               unit: 'Ea',           category: 'Vegetables', price: 21.38  },
  { name: 'Onion Pickle',                           unit: 'Ea',           category: 'Vegetables', price: 21.40  },
  { name: 'Spring Mix',                             unit: 'Ea',           category: 'Vegetables', price: 0      },
  { name: 'White Onion Sliced',                     unit: 'Ea',           category: 'Vegetables', price: 0.61   },

  // Spices & Seasonings
  { name: 'Black Garlic',                           unit: 'Per Bag',      category: 'Spices',     price: 8.39   },
  { name: 'Cajun Mix',                              unit: 'Ea',           category: 'Spices',     price: 3.69   },
  { name: 'Chili Para Pozole',                      unit: 'Ea',           category: 'Spices',     price: 5.93   },
  { name: 'Chilli Oil',                             unit: '15L',          category: 'Spices',     price: 195.98 },
  { name: 'Crushed Chili',                          unit: 'Ea',           category: 'Spices',     price: 86.94  },
  { name: 'Prickly Ash',                            unit: 'Ea',           category: 'Spices',     price: 16.00  },
  { name: 'Sesame Paste',                           unit: 'Ea',           category: 'Spices',     price: 219.78 },

  // Dry Goods & Pantry
  { name: 'B-Mix',                                  unit: 'Full Pan',     category: 'Dry Goods',  price: 72.79  },
  { name: 'Cacahoate (Peanuts)',                    unit: 'Cs-50Lb',      category: 'Dry Goods',  price: 73.30  },
  { name: 'Farli Paste',                            unit: 'Box',          category: 'Dry Goods',  price: 141.24 },
  { name: 'Fish Cake',                              unit: 'CS',           category: 'Dry Goods',  price: 107.31 },
  { name: 'Kikurage',                               unit: 'Full Pan',     category: 'Dry Goods',  price: 53.79  },
  { name: 'Kombu',                                  unit: 'CS',           category: 'Dry Goods',  price: 191.53 },
  { name: 'Mochi',                                  unit: 'Ea',           category: 'Dry Goods',  price: 36.81  },
  { name: 'Mushroom Dried',                         unit: 'Bag',          category: 'Dry Goods',  price: 42.44  },
  { name: 'Wonton',                                 unit: 'Ea',           category: 'Dry Goods',  price: 30.50  },

  // Prepared / Marinated
  { name: 'Eggs Marinate (Morinda de Huevo)',       unit: '15L',          category: 'Prepared',   price: 99.79  },
  { name: 'Seasoned Eggs (Huevos Cocidos)',          unit: 'Full Pan',     category: 'Prepared',   price: 195.85 },
  { name: 'Pepper Smash',                           unit: '1/6 Pan',      category: 'Prepared',   price: 35.61  },
  { name: 'Spicy Edamame',                          unit: 'Ea',           category: 'Prepared',   price: 22.77  },

  // Oils & Fats
  { name: 'Fry Oil',                                unit: 'Ea',           category: 'Oils',       price: 39.54  },
  { name: 'Tempura Oil',                            unit: 'Ea',           category: 'Oils',       price: 140.84 },

  // Supplies
  { name: 'Guantes L',                              unit: 'Cs/10box',     category: 'Supplies',   price: 44.94  },
  { name: 'Plastic Kit 4CS',                        unit: 'CS',           category: 'Supplies',   price: 79.18  },
  { name: 'Tray Food',                              unit: 'Ea',           category: 'Supplies',   price: 1.07   },
  { name: 'SYS',                                    unit: 'Ea',           category: 'Supplies',   price: 11.65  },
  { name: 'Other',                                  unit: 'Ea',           category: 'Supplies',   price: 10.70  },
];

function toCode(index) {
  return `ITM${String(index + 1).padStart(3, '0')}`;
}

async function run() {
  const t = await sequelize.transaction();
  try {
    console.log('Upserting items (preserving existing IDs)...');

    // Upsert by code — never delete, so existing order_lines stay valid
    const created = [];
    for (let i = 0; i < ITEMS.length; i++) {
      const item = ITEMS[i];
      const code = toCode(i);
      const [record] = await Item.findOrCreate({
        where: { code },
        defaults: { code, name: item.name, unit: item.unit, category: item.category, is_active: true },
        transaction: t,
      });
      // Update fields in case they changed
      await record.update({ name: item.name, unit: item.unit, category: item.category, is_active: true }, { transaction: t });
      created.push(record);
    }

    console.log(`Inserting ${ITEMS.length} items...`);

    console.log('Creating price_master entries...');
    // Upsert prices — deactivate old then set latest active
    let priceCount = 0;
    for (let i = 0; i < created.length; i++) {
      const price = ITEMS[i].price;
      if (!price || price <= 0) continue;
      const item = created[i];
      // Deactivate existing active prices for this item
      await PriceMaster.update({ is_active: false }, { where: { item_id: item.id, is_active: true }, transaction: t });
      // Insert new active price
      await PriceMaster.create({ item_id: item.id, price, effective_date: TODAY, end_date: null, is_active: true }, { transaction: t });
      priceCount++;
    }

    await t.commit();
    console.log(`\n✓ Imported ${created.length} items`);
    console.log(`✓ Upserted ${priceCount} price entries`);

    const cats = {};
    ITEMS.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
    console.log('\nBy category:');
    Object.entries(cats).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => console.log(`  ${c}: ${n}`));

  } catch (err) {
    await t.rollback();
    console.error('Import failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
