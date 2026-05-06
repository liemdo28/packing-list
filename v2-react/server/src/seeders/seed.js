require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const { sequelize, Store, User, Item, PriceMaster, Order, OrderLine, Notification } = require('../models');

async function seed() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected. Syncing models...');
    await sequelize.sync({ force: true });
    console.log('Models synced. Seeding data...');

    // ---- Stores ----
    const stores = await Store.bulkCreate([
      { code: 'B1', name: 'Branch 1 - Main Store', address: '123 Main St, City Center', phone: '02-111-1111' },
      { code: 'B2', name: 'Branch 2 - South Store', address: '456 South Ave, South District', phone: '02-222-2222' },
      { code: 'B3', name: 'Branch 3 - North Store', address: '789 North Rd, North District', phone: '02-333-3333' },
    ]);
    console.log('Stores created');

    const [b1, b2, b3] = stores;

    // ---- Users ----
    const hashedPassword = await bcrypt.hash('password', 10);
    const users = await User.bulkCreate([
      { username: 'admin', password: hashedPassword, full_name: 'System Admin', email: 'admin@packinglist.com', role: 'admin', store_id: null },
      { username: 'user_b1', password: hashedPassword, full_name: 'B1 Manager', email: 'b1@packinglist.com', role: 'b1', store_id: b1.id },
      { username: 'user_b2', password: hashedPassword, full_name: 'B2 Manager', email: 'b2@packinglist.com', role: 'b2', store_id: b2.id },
      { username: 'user_b3', password: hashedPassword, full_name: 'B3 Manager', email: 'b3@packinglist.com', role: 'b3', store_id: b3.id },
      { username: 'accountant', password: hashedPassword, full_name: 'Finance Team', email: 'finance@packinglist.com', role: 'accountant', store_id: null },
    ]);
    console.log('Users created');

    const [adminUser, userB1, userB2, userB3, acctUser] = users;

    // ---- Items ----
    const itemsData = [
      { code: 'ITM001', name: 'Coca-Cola 330ml', category: 'Beverages', unit: 'can', description: 'Coca-Cola original 330ml can' },
      { code: 'ITM002', name: 'Pepsi 330ml', category: 'Beverages', unit: 'can', description: 'Pepsi cola 330ml can' },
      { code: 'ITM003', name: 'Sprite 330ml', category: 'Beverages', unit: 'can', description: 'Sprite lemon-lime 330ml can' },
      { code: 'ITM004', name: 'Water 600ml', category: 'Beverages', unit: 'bottle', description: 'Purified drinking water 600ml' },
      { code: 'ITM005', name: 'Orange Juice 1L', category: 'Beverages', unit: 'carton', description: 'Fresh orange juice 1 liter' },
      { code: 'ITM006', name: 'Instant Noodles - Chicken', category: 'Food', unit: 'pack', description: 'Instant noodles chicken flavor' },
      { code: 'ITM007', name: 'Instant Noodles - Shrimp', category: 'Food', unit: 'pack', description: 'Instant noodles shrimp flavor' },
      { code: 'ITM008', name: 'Rice 5kg', category: 'Food', unit: 'bag', description: 'Jasmine rice 5kg bag' },
      { code: 'ITM009', name: 'Cooking Oil 1L', category: 'Food', unit: 'bottle', description: 'Vegetable cooking oil 1 liter' },
      { code: 'ITM010', name: 'Sugar 1kg', category: 'Food', unit: 'bag', description: 'White refined sugar 1kg' },
      { code: 'ITM011', name: 'Soy Sauce 700ml', category: 'Food', unit: 'bottle', description: 'Soy sauce 700ml bottle' },
      { code: 'ITM012', name: 'Fish Sauce 700ml', category: 'Food', unit: 'bottle', description: 'Premium fish sauce 700ml' },
      { code: 'ITM013', name: 'Paper Towel Roll', category: 'Supplies', unit: 'roll', description: 'Paper towel kitchen roll' },
      { code: 'ITM014', name: 'Trash Bags (Large)', category: 'Supplies', unit: 'pack', description: 'Large trash bags, 10 per pack' },
      { code: 'ITM015', name: 'Dish Soap 500ml', category: 'Supplies', unit: 'bottle', description: 'Liquid dish soap 500ml' },
      { code: 'ITM016', name: 'Hand Soap 250ml', category: 'Supplies', unit: 'bottle', description: 'Antibacterial hand soap 250ml' },
      { code: 'ITM017', name: 'Cleaning Spray 500ml', category: 'Supplies', unit: 'bottle', description: 'Multi-purpose cleaning spray' },
      { code: 'ITM018', name: 'Napkins (100 pack)', category: 'Supplies', unit: 'pack', description: 'Paper napkins, 100 per pack' },
      { code: 'ITM019', name: 'Plastic Cups (50 pack)', category: 'Supplies', unit: 'pack', description: 'Disposable plastic cups' },
      { code: 'ITM020', name: 'Straws (100 pack)', category: 'Supplies', unit: 'pack', description: 'Paper straws, 100 per pack' },
      { code: 'ITM021', name: 'Coffee Beans 500g', category: 'Beverages', unit: 'bag', description: 'Premium arabica coffee beans' },
      { code: 'ITM022', name: 'Tea Bags (25 pack)', category: 'Beverages', unit: 'box', description: 'Green tea bags, 25 per box' },
      { code: 'ITM023', name: 'Milk UHT 1L', category: 'Beverages', unit: 'carton', description: 'UHT full cream milk 1 liter' },
      { code: 'ITM024', name: 'Butter 200g', category: 'Food', unit: 'block', description: 'Salted butter 200g block' },
      { code: 'ITM025', name: 'Flour 1kg', category: 'Food', unit: 'bag', description: 'All-purpose flour 1kg' },
    ];

    const items = await Item.bulkCreate(itemsData);
    console.log('Items created');

    // ---- Prices ----
    const prices = [
      15, 15, 14, 8, 45, 6, 6, 189, 55, 28,
      25, 30, 35, 45, 29, 39, 65, 25, 30, 20,
      250, 55, 38, 85, 32,
    ];

    const priceRecords = items.map((item, idx) => ({
      item_id: item.id,
      price: prices[idx],
      effective_date: '2025-01-01',
      is_active: true,
      created_by: adminUser.id,
    }));

    await PriceMaster.bulkCreate(priceRecords);
    console.log('Prices created');

    // ---- Sample Orders ----
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Order 1: B1 -> B2, Completed
    const order1 = await Order.create({
      order_number: `PL-${dateStr}-001`,
      from_store_id: b1.id,
      to_store_id: b2.id,
      status: 'completed',
      notes: 'Monthly supply transfer',
      total_amount: 234,
      created_by: userB1.id,
      submitted_at: new Date(today - 7 * 86400000),
      prepared_at: new Date(today - 6 * 86400000),
      shipped_at: new Date(today - 5 * 86400000),
      received_at: new Date(today - 4 * 86400000),
      completed_at: new Date(today - 3 * 86400000),
    });
    await OrderLine.bulkCreate([
      { order_id: order1.id, item_id: items[0].id, quantity: 10, unit_price: 15, total_price: 150 },
      { order_id: order1.id, item_id: items[3].id, quantity: 5, unit_price: 8, total_price: 40 },
      { order_id: order1.id, item_id: items[5].id, quantity: 4, unit_price: 6, total_price: 24 },
      { order_id: order1.id, item_id: items[12].id, quantity: 2, unit_price: 10, total_price: 20 },
    ]);

    // Order 2: B1 -> B3, Shipped
    const order2 = await Order.create({
      order_number: `PL-${dateStr}-002`,
      from_store_id: b1.id,
      to_store_id: b3.id,
      status: 'in_transit',
      notes: 'Urgent restocking',
      created_by: userB1.id,
      submitted_at: new Date(today - 3 * 86400000),
      prepared_at: new Date(today - 2 * 86400000),
      shipped_at: new Date(today - 86400000),
    });
    await OrderLine.bulkCreate([
      { order_id: order2.id, item_id: items[7].id, quantity: 3, unit_price: 189, total_price: 567 },
      { order_id: order2.id, item_id: items[8].id, quantity: 6, unit_price: 55, total_price: 330 },
    ]);

    // Order 3: B3 -> B1, Submitted
    const order3 = await Order.create({
      order_number: `PL-${dateStr}-003`,
      from_store_id: b3.id,
      to_store_id: b1.id,
      status: 'submitted',
      notes: 'Return excess stock',
      created_by: userB3.id,
      submitted_at: new Date(today - 86400000),
    });
    await OrderLine.bulkCreate([
      { order_id: order3.id, item_id: items[20].id, quantity: 5, unit_price: 250, total_price: 1250 },
    ]);

    // Order 4: B3 -> B2, Draft
    const order4 = await Order.create({
      order_number: `PL-${dateStr}-004`,
      from_store_id: b3.id,
      to_store_id: b2.id,
      status: 'draft',
      notes: 'Need review before sending',
      created_by: userB3.id,
    });
    await OrderLine.bulkCreate([
      { order_id: order4.id, item_id: items[14].id, quantity: 10 },
      { order_id: order4.id, item_id: items[15].id, quantity: 8 },
    ]);

    // Order 5: B1 -> B2, Cancelled
    const order5 = await Order.create({
      order_number: `PL-${dateStr}-005`,
      from_store_id: b1.id,
      to_store_id: b2.id,
      status: 'cancelled',
      notes: 'Duplicate order',
      cancel_reason: 'Duplicate of order 001',
      created_by: userB1.id,
      submitted_at: new Date(today - 5 * 86400000),
      cancelled_at: new Date(today - 4 * 86400000),
    });
    await OrderLine.bulkCreate([
      { order_id: order5.id, item_id: items[0].id, quantity: 10 },
    ]);

    console.log('Orders created');

    // ---- Notifications ----
    await Notification.bulkCreate([
      { user_id: userB1.id, title: 'Order Completed', message: `Order PL-${dateStr}-001 has been completed`, type: 'order', reference_type: 'order', reference_id: order1.id },
      { user_id: userB2.id, title: 'Order Shipped', message: `Order PL-${dateStr}-002 has been shipped from B1`, type: 'order', reference_type: 'order', reference_id: order2.id },
      { user_id: userB3.id, title: 'New Order', message: `Order PL-${dateStr}-003 has been submitted`, type: 'order', reference_type: 'order', reference_id: order3.id },
      { user_id: adminUser.id, title: 'System Notice', message: 'Monthly reconciliation reminder', type: 'system' },
      { user_id: acctUser.id, title: 'Invoice Due', message: 'Four Season invoice due in 5 days', type: 'invoice' },
    ]);
    console.log('Notifications created');

    console.log('\n--- Seed completed successfully ---');
    console.log('\nTest Accounts:');
    console.log('  admin    / password  (System Admin)');
    console.log('  user_b1  / password  (B1 Manager)');
    console.log('  user_b2  / password  (B2 Manager)');
    console.log('  user_b3  / password  (B3 Manager)');
    console.log('  accountant / password  (Accountant)');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
