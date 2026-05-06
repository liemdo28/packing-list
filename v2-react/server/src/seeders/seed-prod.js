/**
 * seed-prod.js — Production-safe, idempotent seeder
 *
 * Safe to run on a live database:
 *   - NEVER calls sequelize.sync({ force: true })
 *   - Uses findOrCreate for stores and users — skips existing rows
 *   - Accepts passwords via env vars (SEED_ADMIN_PASS, SEED_STORE_PASS)
 *   - Logs a summary of what was created vs skipped
 *
 * Usage:
 *   node src/seeders/seed-prod.js
 *
 * Env:
 *   NODE_ENV=production
 *   DB_HOST / DB_NAME / DB_USER / DB_PASS / DB_DIALECT  (same as server)
 *   SEED_ADMIN_PASS   — admin user password   (required)
 *   SEED_STORE_PASS   — all store user passwords (required)
 *   SEED_ACCT_PASS    — accountant password (falls back to SEED_STORE_PASS)
 */

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { sequelize, Store, User } = require('../models');

const ADMIN_PASS = process.env.SEED_ADMIN_PASS;
const STORE_PASS = process.env.SEED_STORE_PASS;
const ACCT_PASS  = process.env.SEED_ACCT_PASS || STORE_PASS;

if (!ADMIN_PASS || !STORE_PASS) {
  console.error('ERROR: SEED_ADMIN_PASS and SEED_STORE_PASS must be set in environment.');
  console.error('Example:');
  console.error('  SEED_ADMIN_PASS="..." SEED_STORE_PASS="..." node src/seeders/seed-prod.js');
  process.exit(1);
}

async function seedProd() {
  let created = 0;
  let skipped = 0;

  await sequelize.authenticate();
  console.log('DB connected.');

  // ── Stores ──────────────────────────────────────────────────────────────────

  const storeDefs = [
    { code: 'B1', name: 'Branch 1 - Main Store',  address: '123 Main St, City Center',      phone: '02-111-1111', is_active: true },
    { code: 'B2', name: 'Branch 2 - South Store', address: '456 South Ave, South District', phone: '02-222-2222', is_active: true },
    { code: 'B3', name: 'Branch 3 - North Store', address: '789 North Rd, North District',  phone: '02-333-3333', is_active: true },
  ];

  const storeMap = {};
  for (const def of storeDefs) {
    const [store, wasCreated] = await Store.findOrCreate({
      where: { code: def.code },
      defaults: def,
    });
    storeMap[def.code] = store;
    if (wasCreated) { created++; console.log(`  [+] Store ${def.code}`); }
    else             { skipped++; console.log(`  [=] Store ${def.code} (exists)`); }
  }

  // ── Users ────────────────────────────────────────────────────────────────────

  const BCRYPT_ROUNDS = 12;
  const [adminHash, storeHash, acctHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASS, BCRYPT_ROUNDS),
    bcrypt.hash(STORE_PASS, BCRYPT_ROUNDS),
    bcrypt.hash(ACCT_PASS,  BCRYPT_ROUNDS),
  ]);

  const userDefs = [
    {
      username:  'admin',
      password:  adminHash,
      full_name: 'System Admin',
      email:     'admin@packinglist.local',
      role:      'admin',
      store_id:  null,
      is_active: true,
    },
    {
      username:  'user_b1',
      password:  storeHash,
      full_name: 'B1 Store Manager',
      email:     'b1@packinglist.local',
      role:      'b1',
      store_id:  storeMap['B1'].id,
      is_active: true,
    },
    {
      username:  'user_b2',
      password:  storeHash,
      full_name: 'B2 Store Manager',
      email:     'b2@packinglist.local',
      role:      'b2',
      store_id:  storeMap['B2'].id,
      is_active: true,
    },
    {
      username:  'user_b3',
      password:  storeHash,
      full_name: 'B3 Store Manager',
      email:     'b3@packinglist.local',
      role:      'b3',
      store_id:  storeMap['B3'].id,
      is_active: true,
    },
    {
      username:  'accountant',
      password:  acctHash,
      full_name: 'Finance Team',
      email:     'finance@packinglist.local',
      role:      'accountant',
      store_id:  null,
      is_active: true,
    },
  ];

  for (const def of userDefs) {
    const [, wasCreated] = await User.findOrCreate({
      where: { username: def.username },
      defaults: def,
    });
    if (wasCreated) { created++; console.log(`  [+] User  ${def.username} (${def.role})`); }
    else             { skipped++; console.log(`  [=] User  ${def.username} (exists — password NOT changed)`); }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  console.log('\nStore testing accounts:');
  console.log('  admin      / $SEED_ADMIN_PASS  — full access');
  console.log('  user_b1    / $SEED_STORE_PASS  — B1 store (creates & ships orders)');
  console.log('  user_b2    / $SEED_STORE_PASS  — B2 store (receives orders)');
  console.log('  user_b3    / $SEED_STORE_PASS  — B3 store');
  console.log('  accountant / $SEED_ACCT_PASS   — pricing & reporting');
}

seedProd()
  .then(() => process.exit(0))
  .catch(err => { console.error('Seed failed:', err); process.exit(1); });
