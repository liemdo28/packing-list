/**
 * Five built-in trip templates. Each item references a DEFAULT_CATEGORIES id so
 * the category icon/name always resolves correctly.
 */
export const BUILT_IN_TEMPLATES = [
  /* ─────────────────────────── BEACH ──────────────────────────── */
  {
    id: 'tpl-beach',
    name: 'Beach Getaway',
    tripType: 'beach',
    description: 'Sun, sand, and sea — everything you need for the perfect beach trip.',
    isBuiltIn: true,
    items: [
      // Clothing
      { id: 'ti-b1',  categoryId: 'cat-clothing',      name: 'Swimsuit',             quantity: 2, essential: true,  orderIndex: 0 },
      { id: 'ti-b2',  categoryId: 'cat-clothing',      name: 'Board shorts',         quantity: 2, essential: false, orderIndex: 1 },
      { id: 'ti-b3',  categoryId: 'cat-clothing',      name: 'T-shirts',             quantity: 4, essential: false, orderIndex: 2 },
      { id: 'ti-b4',  categoryId: 'cat-clothing',      name: 'Cover-up / sarong',    quantity: 1, essential: false, orderIndex: 3 },
      { id: 'ti-b5',  categoryId: 'cat-clothing',      name: 'Sandals',              quantity: 1, essential: true,  orderIndex: 4 },
      { id: 'ti-b6',  categoryId: 'cat-clothing',      name: 'Sun hat',              quantity: 1, essential: true,  orderIndex: 5 },
      { id: 'ti-b7',  categoryId: 'cat-clothing',      name: 'Sunglasses',           quantity: 1, essential: true,  orderIndex: 6 },
      // Toiletries
      { id: 'ti-b8',  categoryId: 'cat-toiletries',    name: 'Sunscreen SPF 50+',    quantity: 1, essential: true,  orderIndex: 7 },
      { id: 'ti-b9',  categoryId: 'cat-toiletries',    name: 'After-sun lotion',     quantity: 1, essential: false, orderIndex: 8 },
      { id: 'ti-b10', categoryId: 'cat-toiletries',    name: 'Lip balm with SPF',    quantity: 1, essential: false, orderIndex: 9 },
      { id: 'ti-b11', categoryId: 'cat-toiletries',    name: 'Insect repellent',     quantity: 1, essential: false, orderIndex: 10 },
      // Documents
      { id: 'ti-b12', categoryId: 'cat-documents',     name: 'Passport / ID',        quantity: 1, essential: true,  orderIndex: 11 },
      { id: 'ti-b13', categoryId: 'cat-documents',     name: 'Hotel confirmation',   quantity: 1, essential: true,  orderIndex: 12 },
      { id: 'ti-b14', categoryId: 'cat-documents',     name: 'Travel insurance',     quantity: 1, essential: false, orderIndex: 13 },
      // Electronics
      { id: 'ti-b15', categoryId: 'cat-electronics',   name: 'Phone charger',        quantity: 1, essential: true,  orderIndex: 14 },
      { id: 'ti-b16', categoryId: 'cat-electronics',   name: 'Waterproof phone case',quantity: 1, essential: false, orderIndex: 15 },
      { id: 'ti-b17', categoryId: 'cat-electronics',   name: 'Portable battery',     quantity: 1, essential: false, orderIndex: 16 },
      // Health
      { id: 'ti-b18', categoryId: 'cat-health',        name: 'Pain relievers',       quantity: 1, essential: false, orderIndex: 17 },
      { id: 'ti-b19', categoryId: 'cat-health',        name: 'Antihistamines',       quantity: 1, essential: false, orderIndex: 18 },
      // Misc
      { id: 'ti-b20', categoryId: 'cat-misc',          name: 'Beach towel',          quantity: 2, essential: true,  orderIndex: 19 },
      { id: 'ti-b21', categoryId: 'cat-misc',          name: 'Reusable water bottle',quantity: 1, essential: true,  orderIndex: 20 },
      { id: 'ti-b22', categoryId: 'cat-misc',          name: 'Beach bag',            quantity: 1, essential: false, orderIndex: 21 },
    ],
  },

  /* ─────────────────────────── BUSINESS ──────────────────────── */
  {
    id: 'tpl-business',
    name: 'Business Trip',
    tripType: 'business',
    description: 'Professional and polished — everything for a successful work trip.',
    isBuiltIn: true,
    items: [
      // Clothing
      { id: 'ti-bu1',  categoryId: 'cat-clothing',    name: 'Dress shirts',           quantity: 3, essential: true,  orderIndex: 0 },
      { id: 'ti-bu2',  categoryId: 'cat-clothing',    name: 'Dress trousers',         quantity: 2, essential: true,  orderIndex: 1 },
      { id: 'ti-bu3',  categoryId: 'cat-clothing',    name: 'Blazer / suit jacket',   quantity: 1, essential: true,  orderIndex: 2 },
      { id: 'ti-bu4',  categoryId: 'cat-clothing',    name: 'Business shoes',         quantity: 1, essential: true,  orderIndex: 3 },
      { id: 'ti-bu5',  categoryId: 'cat-clothing',    name: 'Belt',                   quantity: 1, essential: false, orderIndex: 4 },
      { id: 'ti-bu6',  categoryId: 'cat-clothing',    name: 'Ties',                   quantity: 2, essential: false, orderIndex: 5 },
      { id: 'ti-bu7',  categoryId: 'cat-clothing',    name: 'Undershirts',            quantity: 4, essential: false, orderIndex: 6 },
      { id: 'ti-bu8',  categoryId: 'cat-clothing',    name: 'Dress socks',            quantity: 4, essential: false, orderIndex: 7 },
      // Electronics
      { id: 'ti-bu9',  categoryId: 'cat-electronics', name: 'Laptop',                 quantity: 1, essential: true,  orderIndex: 8 },
      { id: 'ti-bu10', categoryId: 'cat-electronics', name: 'Laptop charger',         quantity: 1, essential: true,  orderIndex: 9 },
      { id: 'ti-bu11', categoryId: 'cat-electronics', name: 'Phone charger',          quantity: 1, essential: true,  orderIndex: 10 },
      { id: 'ti-bu12', categoryId: 'cat-electronics', name: 'Universal power adapter',quantity: 1, essential: false, orderIndex: 11 },
      { id: 'ti-bu13', categoryId: 'cat-electronics', name: 'Presentation remote',    quantity: 1, essential: false, orderIndex: 12 },
      // Documents
      { id: 'ti-bu14', categoryId: 'cat-documents',   name: 'Business cards',         quantity: 1, essential: true,  orderIndex: 13 },
      { id: 'ti-bu15', categoryId: 'cat-documents',   name: 'Passport / ID',          quantity: 1, essential: true,  orderIndex: 14 },
      { id: 'ti-bu16', categoryId: 'cat-documents',   name: 'Meeting agenda / notes', quantity: 1, essential: false, orderIndex: 15 },
      { id: 'ti-bu17', categoryId: 'cat-documents',   name: 'Hotel confirmation',     quantity: 1, essential: true,  orderIndex: 16 },
      // Toiletries
      { id: 'ti-bu18', categoryId: 'cat-toiletries',  name: 'Deodorant',              quantity: 1, essential: true,  orderIndex: 17 },
      { id: 'ti-bu19', categoryId: 'cat-toiletries',  name: 'Razor',                  quantity: 1, essential: false, orderIndex: 18 },
      { id: 'ti-bu20', categoryId: 'cat-toiletries',  name: 'Cologne / perfume',      quantity: 1, essential: false, orderIndex: 19 },
      { id: 'ti-bu21', categoryId: 'cat-toiletries',  name: 'Toothbrush & toothpaste',quantity: 1, essential: true,  orderIndex: 20 },
    ],
  },

  /* ─────────────────────────── FAMILY ────────────────────────── */
  {
    id: 'tpl-family',
    name: 'Family Vacation',
    tripType: 'family',
    description: 'Keep the whole family comfortable and entertained on the road.',
    isBuiltIn: true,
    items: [
      // Clothing
      { id: 'ti-f1',  categoryId: 'cat-clothing',      name: "Kids' outfits",           quantity: 5, essential: true,  orderIndex: 0 },
      { id: 'ti-f2',  categoryId: 'cat-clothing',      name: 'Adult outfits',            quantity: 4, essential: true,  orderIndex: 1 },
      { id: 'ti-f3',  categoryId: 'cat-clothing',      name: 'Pajamas (all family)',     quantity: 3, essential: true,  orderIndex: 2 },
      { id: 'ti-f4',  categoryId: 'cat-clothing',      name: 'Rain jackets',             quantity: 2, essential: false, orderIndex: 3 },
      { id: 'ti-f5',  categoryId: 'cat-clothing',      name: "Extra kids' clothes",      quantity: 3, essential: false, orderIndex: 4 },
      // Health
      { id: 'ti-f6',  categoryId: 'cat-health',        name: "Children's pain reliever", quantity: 1, essential: true,  orderIndex: 5 },
      { id: 'ti-f7',  categoryId: 'cat-health',        name: 'Thermometer',              quantity: 1, essential: true,  orderIndex: 6 },
      { id: 'ti-f8',  categoryId: 'cat-health',        name: 'Sunscreen',                quantity: 1, essential: true,  orderIndex: 7 },
      { id: 'ti-f9',  categoryId: 'cat-health',        name: 'Band-aids & first aid',    quantity: 1, essential: true,  orderIndex: 8 },
      { id: 'ti-f10', categoryId: 'cat-health',        name: 'Hand sanitizer',           quantity: 2, essential: false, orderIndex: 9 },
      // Entertainment
      { id: 'ti-f11', categoryId: 'cat-entertainment', name: 'Tablet + kids shows',      quantity: 1, essential: false, orderIndex: 10 },
      { id: 'ti-f12', categoryId: 'cat-entertainment', name: 'Coloring books & crayons', quantity: 2, essential: false, orderIndex: 11 },
      { id: 'ti-f13', categoryId: 'cat-entertainment', name: 'Card games',               quantity: 1, essential: false, orderIndex: 12 },
      { id: 'ti-f14', categoryId: 'cat-entertainment', name: "Kids' favorite toy",       quantity: 1, essential: false, orderIndex: 13 },
      // Documents
      { id: 'ti-f15', categoryId: 'cat-documents',     name: 'Passports (all family)',   quantity: 1, essential: true,  orderIndex: 14 },
      { id: 'ti-f16', categoryId: 'cat-documents',     name: "Kids' ID / birth certs",   quantity: 1, essential: true,  orderIndex: 15 },
      { id: 'ti-f17', categoryId: 'cat-documents',     name: 'Hotel confirmation',       quantity: 1, essential: true,  orderIndex: 16 },
      { id: 'ti-f18', categoryId: 'cat-documents',     name: 'Travel insurance',         quantity: 1, essential: false, orderIndex: 17 },
      // Toiletries
      { id: 'ti-f19', categoryId: 'cat-toiletries',    name: 'Baby wipes',               quantity: 2, essential: false, orderIndex: 18 },
      { id: 'ti-f20', categoryId: 'cat-toiletries',    name: 'Shampoo & body wash',      quantity: 1, essential: false, orderIndex: 19 },
      { id: 'ti-f21', categoryId: 'cat-toiletries',    name: 'Toothbrushes (all)',       quantity: 1, essential: true,  orderIndex: 20 },
      // Electronics
      { id: 'ti-f22', categoryId: 'cat-electronics',   name: 'Phone chargers',           quantity: 2, essential: true,  orderIndex: 21 },
      { id: 'ti-f23', categoryId: 'cat-electronics',   name: 'Tablet charger',           quantity: 1, essential: false, orderIndex: 22 },
    ],
  },

  /* ─────────────────────────── WEEKEND ───────────────────────── */
  {
    id: 'tpl-weekend',
    name: 'Weekend Trip',
    tripType: 'weekend',
    description: 'Pack light and move fast — the essentials for a 2–3 day escape.',
    isBuiltIn: true,
    items: [
      // Clothing
      { id: 'ti-w1',  categoryId: 'cat-clothing',    name: 'Casual outfits',          quantity: 2, essential: true,  orderIndex: 0 },
      { id: 'ti-w2',  categoryId: 'cat-clothing',    name: 'Jacket / hoodie',         quantity: 1, essential: false, orderIndex: 1 },
      { id: 'ti-w3',  categoryId: 'cat-clothing',    name: 'Underwear',               quantity: 3, essential: true,  orderIndex: 2 },
      { id: 'ti-w4',  categoryId: 'cat-clothing',    name: 'Socks',                   quantity: 3, essential: true,  orderIndex: 3 },
      { id: 'ti-w5',  categoryId: 'cat-clothing',    name: 'Comfortable shoes',       quantity: 1, essential: true,  orderIndex: 4 },
      { id: 'ti-w6',  categoryId: 'cat-clothing',    name: 'Pajamas',                 quantity: 1, essential: false, orderIndex: 5 },
      // Toiletries
      { id: 'ti-w7',  categoryId: 'cat-toiletries',  name: 'Toothbrush',              quantity: 1, essential: true,  orderIndex: 6 },
      { id: 'ti-w8',  categoryId: 'cat-toiletries',  name: 'Toothpaste',              quantity: 1, essential: true,  orderIndex: 7 },
      { id: 'ti-w9',  categoryId: 'cat-toiletries',  name: 'Deodorant',               quantity: 1, essential: true,  orderIndex: 8 },
      { id: 'ti-w10', categoryId: 'cat-toiletries',  name: 'Shampoo',                 quantity: 1, essential: false, orderIndex: 9 },
      { id: 'ti-w11', categoryId: 'cat-toiletries',  name: 'Face wash',               quantity: 1, essential: false, orderIndex: 10 },
      // Electronics
      { id: 'ti-w12', categoryId: 'cat-electronics', name: 'Phone charger',           quantity: 1, essential: true,  orderIndex: 11 },
      // Documents
      { id: 'ti-w13', categoryId: 'cat-documents',   name: 'ID / driver\'s licence',  quantity: 1, essential: true,  orderIndex: 12 },
      { id: 'ti-w14', categoryId: 'cat-documents',   name: 'Accommodation details',   quantity: 1, essential: false, orderIndex: 13 },
      // Health
      { id: 'ti-w15', categoryId: 'cat-health',      name: 'Pain relievers',          quantity: 1, essential: false, orderIndex: 14 },
      // Entertainment
      { id: 'ti-w16', categoryId: 'cat-entertainment','name': 'Book / e-reader',       quantity: 1, essential: false, orderIndex: 15 },
    ],
  },

  /* ─────────────────────── INTERNATIONAL ─────────────────────── */
  {
    id: 'tpl-international',
    name: 'International Travel',
    tripType: 'international',
    description: 'Cross-border travel checklist — don\'t leave home without these.',
    isBuiltIn: true,
    items: [
      // Documents
      { id: 'ti-i1',  categoryId: 'cat-documents',    name: 'Passport',                   quantity: 1, essential: true,  orderIndex: 0 },
      { id: 'ti-i2',  categoryId: 'cat-documents',    name: 'Visa / entry permit',        quantity: 1, essential: true,  orderIndex: 1 },
      { id: 'ti-i3',  categoryId: 'cat-documents',    name: 'Travel insurance certificate',quantity: 1, essential: true,  orderIndex: 2 },
      { id: 'ti-i4',  categoryId: 'cat-documents',    name: 'Emergency contact card',     quantity: 1, essential: true,  orderIndex: 3 },
      { id: 'ti-i5',  categoryId: 'cat-documents',    name: 'Hotel / itinerary printout', quantity: 1, essential: true,  orderIndex: 4 },
      { id: 'ti-i6',  categoryId: 'cat-documents',    name: 'Copies of all documents',    quantity: 1, essential: true,  orderIndex: 5 },
      // Clothing
      { id: 'ti-i7',  categoryId: 'cat-clothing',     name: 'Versatile outfits',          quantity: 6, essential: true,  orderIndex: 6 },
      { id: 'ti-i8',  categoryId: 'cat-clothing',     name: 'Layering pieces',            quantity: 2, essential: false, orderIndex: 7 },
      { id: 'ti-i9',  categoryId: 'cat-clothing',     name: 'Comfortable walking shoes',  quantity: 1, essential: true,  orderIndex: 8 },
      { id: 'ti-i10', categoryId: 'cat-clothing',     name: 'Formal / smart attire',      quantity: 1, essential: false, orderIndex: 9 },
      { id: 'ti-i11', categoryId: 'cat-clothing',     name: 'Underwear',                  quantity: 7, essential: true,  orderIndex: 10 },
      // Electronics
      { id: 'ti-i12', categoryId: 'cat-electronics',  name: 'Universal power adapter',    quantity: 1, essential: true,  orderIndex: 11 },
      { id: 'ti-i13', categoryId: 'cat-electronics',  name: 'Laptop + charger',           quantity: 1, essential: false, orderIndex: 12 },
      { id: 'ti-i14', categoryId: 'cat-electronics',  name: 'Phone + charger',            quantity: 1, essential: true,  orderIndex: 13 },
      { id: 'ti-i15', categoryId: 'cat-electronics',  name: 'Portable battery bank',      quantity: 2, essential: false, orderIndex: 14 },
      // Health
      { id: 'ti-i16', categoryId: 'cat-health',       name: 'Prescription medications',   quantity: 1, essential: true,  orderIndex: 15 },
      { id: 'ti-i17', categoryId: 'cat-health',       name: 'Vaccination record / card',  quantity: 1, essential: true,  orderIndex: 16 },
      { id: 'ti-i18', categoryId: 'cat-health',       name: 'Motion sickness medication', quantity: 1, essential: false, orderIndex: 17 },
      { id: 'ti-i19', categoryId: 'cat-health',       name: 'Travel first-aid kit',       quantity: 1, essential: false, orderIndex: 18 },
      // Toiletries
      { id: 'ti-i20', categoryId: 'cat-toiletries',   name: 'Travel-size toiletries set', quantity: 1, essential: true,  orderIndex: 19 },
      { id: 'ti-i21', categoryId: 'cat-toiletries',   name: 'Hand sanitizer',             quantity: 2, essential: false, orderIndex: 20 },
      // Misc
      { id: 'ti-i22', categoryId: 'cat-misc',         name: 'Local currency / cash',      quantity: 1, essential: true,  orderIndex: 21 },
      { id: 'ti-i23', categoryId: 'cat-misc',         name: 'Travel credit / debit card', quantity: 1, essential: true,  orderIndex: 22 },
      { id: 'ti-i24', categoryId: 'cat-misc',         name: 'Travel pillow',              quantity: 1, essential: false, orderIndex: 23 },
      { id: 'ti-i25', categoryId: 'cat-misc',         name: 'Reusable water bottle',      quantity: 1, essential: false, orderIndex: 24 },
      { id: 'ti-i26', categoryId: 'cat-misc',         name: 'Language phrasebook / app',  quantity: 1, essential: false, orderIndex: 25 },
    ],
  },
];
