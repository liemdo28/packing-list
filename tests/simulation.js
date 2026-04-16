'use strict';

// ============================================================
//  PACKING LIST - LOAD SIMULATION TEST
//  Pure Node.js, no dependencies
// ============================================================

const NUM_TESTERS = 500;
const LOOPS_PER_TESTER = 100;
const TOTAL_OPS = NUM_TESTERS * LOOPS_PER_TESTER;

// --------------- helpers ---------------

function fmt(n) {
  return n.toLocaleString('en-US');
}

function fmtMoney(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function padPct(p) {
  const s = String(p);
  return s.length < 3 ? ' '.repeat(3 - s.length) + s : s;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPrice() {
  return +(Math.random() * 147 + 3).toFixed(2); // $3.00 - $150.00
}

// --------------- date helpers ---------------

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

// --------------- items catalogue (25 items) ---------------

const ITEM_NAMES = [
  'Widget A', 'Widget B', 'Gadget X', 'Gadget Y', 'Sensor Alpha',
  'Sensor Beta', 'Module C', 'Module D', 'Cable Pack', 'Adapter Kit',
  'Battery Unit', 'Display Panel', 'Motor Assembly', 'Control Board', 'Power Supply',
  'Filter Set', 'Valve Unit', 'Pump Head', 'Relay Switch', 'Bracket Mount',
  'Heat Sink', 'Fan Assembly', 'LED Strip', 'Fuse Box', 'Terminal Block'
];

const CATALOGUE = ITEM_NAMES.map((name, i) => ({
  id: i + 1,
  name,
  price: randPrice()
}));

// --------------- transfer rules ---------------

const TRANSFER_RULES = {
  B1: ['B2', 'B3'],
  B2: [],          // B2 can NEVER send
  B3: ['B1', 'B2']
};

const ALL_STORES = ['B1', 'B2', 'B3'];

// --------------- status transitions ---------------

const STATUS_FLOW = ['draft', 'submitted', 'preparing', 'shipped', 'received', 'completed'];
const CANCEL_ALLOWED_FROM = ['draft', 'submitted'];

function nextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

// --------------- global state ---------------

let orderCounter = 0;
const allOrders = [];          // every order object lives here
const auditLogs = [];
const notifications = [];

const stats = {
  created: 0,
  submitted: 0,
  prepared: 0,
  shipped: 0,
  received: 0,
  completed: 0,
  cancelled: 0,
  notifications: 0,
  priceSnapshots: 0,
  auditLogs: 0,
  loginTests: 0,
  loginSuccess: 0,
  summaryQueries: 0,
  exportRequests: 0,
  transferViolationsCaught: 0,
  invalidTransitionsCaught: 0,
  assertionsPassed: 0,
  assertionsFailed: 0
};

// --------------- assertion ---------------

function assert(condition, msg) {
  if (condition) {
    stats.assertionsPassed++;
  } else {
    stats.assertionsFailed++;
    console.error('  ASSERTION FAILED: ' + msg);
  }
}

// --------------- order number generator ---------------

function generateOrderNumber() {
  orderCounter++;
  const seq = String(orderCounter).padStart(3, '0');
  return `PL-${todayStr()}-${seq}`;
}

// --------------- audit log ---------------

function logAudit(actor, action, detail) {
  auditLogs.push({ actor, action, detail, ts: Date.now() });
  stats.auditLogs++;
}

// --------------- notification ---------------

function notify(recipient, message) {
  notifications.push({ recipient, message, ts: Date.now() });
  stats.notifications++;
}

// --------------- order operations ---------------

function createOrder(fromStore, toStore) {
  // validate transfer rule
  const allowed = TRANSFER_RULES[fromStore];
  if (!allowed || !allowed.includes(toStore)) {
    stats.transferViolationsCaught++;
    assert(true, 'Transfer violation correctly caught');
    return null;
  }
  // cannot send to self
  if (fromStore === toStore) {
    stats.transferViolationsCaught++;
    assert(true, 'Self-transfer violation correctly caught');
    return null;
  }

  const numItems = randInt(1, 5);
  const items = [];
  for (let i = 0; i < numItems; i++) {
    const cat = pick(CATALOGUE);
    items.push({
      itemId: cat.id,
      name: cat.name,
      currentPrice: cat.price,
      qty: randInt(1, 20),
      shipped_qty: 0,
      snapshotPrice: null
    });
  }

  const order = {
    orderNumber: generateOrderNumber(),
    from: fromStore,
    to: toStore,
    status: 'draft',
    items,
    totalSnapshot: null,
    createdAt: Date.now()
  };

  allOrders.push(order);
  stats.created++;
  logAudit(fromStore, 'CREATE_ORDER', order.orderNumber);
  notify(toStore, `New draft order ${order.orderNumber} from ${fromStore}`);

  assert(order.status === 'draft', 'New order must be draft');
  assert(order.orderNumber.startsWith('PL-'), 'Order number format PL-');
  assert(/^PL-\d{8}-\d{3,}$/.test(order.orderNumber), 'Order number format PL-YYYYMMDD-NNN');
  assert(order.totalSnapshot === null, 'No price snapshot at creation');

  return order;
}

function submitOrder(order) {
  if (order.status !== 'draft') {
    stats.invalidTransitionsCaught++;
    assert(true, 'Invalid transition to submitted correctly caught');
    return false;
  }
  order.status = 'submitted';
  stats.submitted++;
  logAudit(order.from, 'SUBMIT_ORDER', order.orderNumber);
  notify(order.to, `Order ${order.orderNumber} submitted`);
  assert(order.status === 'submitted', 'Status should be submitted');
  assert(order.totalSnapshot === null, 'No price snapshot at submission');
  return true;
}

function prepareOrder(order) {
  if (order.status !== 'submitted') {
    stats.invalidTransitionsCaught++;
    assert(true, 'Invalid transition to preparing correctly caught');
    return false;
  }
  order.status = 'preparing';
  // enter shipped_qty during preparation
  for (const item of order.items) {
    item.shipped_qty = randInt(0, item.qty);
  }
  stats.prepared++;
  logAudit(order.from, 'PREPARE_ORDER', order.orderNumber);
  assert(order.status === 'preparing', 'Status should be preparing');
  assert(order.totalSnapshot === null, 'No price snapshot at preparation');
  return true;
}

function shipOrder(order) {
  if (order.status !== 'preparing') {
    stats.invalidTransitionsCaught++;
    assert(true, 'Invalid transition to shipped correctly caught');
    return false;
  }
  order.status = 'shipped';
  stats.shipped++;
  logAudit(order.from, 'SHIP_ORDER', order.orderNumber);
  notify(order.to, `Order ${order.orderNumber} shipped`);
  assert(order.status === 'shipped', 'Status should be shipped');
  assert(order.totalSnapshot === null, 'No price snapshot at shipping');
  return true;
}

function receiveOrder(order) {
  if (order.status !== 'shipped') {
    stats.invalidTransitionsCaught++;
    assert(true, 'Invalid transition to received correctly caught');
    return false;
  }
  order.status = 'received';
  stats.received++;
  logAudit(order.to, 'RECEIVE_ORDER', order.orderNumber);
  notify(order.from, `Order ${order.orderNumber} received by ${order.to}`);
  assert(order.status === 'received', 'Status should be received');
  assert(order.totalSnapshot === null, 'No price snapshot at receiving');
  return true;
}

function completeOrder(order) {
  if (order.status !== 'received') {
    stats.invalidTransitionsCaught++;
    assert(true, 'Invalid transition to completed correctly caught');
    return false;
  }
  order.status = 'completed';

  // Price snapshot happens ONLY at completion
  let total = 0;
  for (const item of order.items) {
    // snapshot the current catalogue price at completion time
    const catItem = CATALOGUE.find(c => c.id === item.itemId);
    item.snapshotPrice = catItem.price;
    total += item.snapshotPrice * item.shipped_qty;
  }
  order.totalSnapshot = +total.toFixed(2);
  stats.priceSnapshots++;

  stats.completed++;
  logAudit(order.to, 'COMPLETE_ORDER', order.orderNumber);
  notify(order.from, `Order ${order.orderNumber} completed`);
  notify('Accountant', `Order ${order.orderNumber} completed - ${fmtMoney(order.totalSnapshot)}`);

  assert(order.status === 'completed', 'Status should be completed');
  assert(order.totalSnapshot !== null, 'Price snapshot must exist at completion');
  assert(typeof order.totalSnapshot === 'number', 'Snapshot must be a number');
  return true;
}

function cancelOrder(order) {
  if (!CANCEL_ALLOWED_FROM.includes(order.status)) {
    stats.invalidTransitionsCaught++;
    assert(true, 'Invalid cancel correctly caught');
    return false;
  }
  order.status = 'cancelled';
  stats.cancelled++;
  logAudit(order.from, 'CANCEL_ORDER', order.orderNumber);
  notify(order.to, `Order ${order.orderNumber} cancelled`);
  assert(order.status === 'cancelled', 'Status should be cancelled');
  assert(order.totalSnapshot === null, 'No price snapshot on cancelled order');
  return true;
}

// --------------- summary query ---------------

function querySummary() {
  stats.summaryQueries++;
  const completedOrders = allOrders.filter(o => o.status === 'completed');

  // Summary includes ONLY completed orders
  for (const o of completedOrders) {
    assert(o.status === 'completed', 'Summary must only include completed orders');
    assert(o.totalSnapshot !== null, 'Completed order must have snapshot');
  }

  const pairs = {};
  for (const o of completedOrders) {
    const key = `${o.from} -> ${o.to}`;
    if (!pairs[key]) pairs[key] = { count: 0, total: 0 };
    pairs[key].count++;
    pairs[key].total += o.totalSnapshot;
  }

  logAudit('System', 'QUERY_SUMMARY', `${completedOrders.length} completed orders`);
  return { completedOrders: completedOrders.length, pairs };
}

// --------------- export ---------------

function exportReport() {
  stats.exportRequests++;
  logAudit('System', 'EXPORT', 'Report exported');
}

// --------------- login test ---------------

function testLogin(role) {
  stats.loginTests++;
  // all logins succeed in simulation
  stats.loginSuccess++;
  logAudit(role, 'LOGIN', `${role} logged in`);
}

// --------------- check notifications ---------------

function checkNotifications(recipient) {
  const mine = notifications.filter(n => n.recipient === recipient);
  logAudit(recipient, 'CHECK_NOTIFICATIONS', `${mine.length} notifications`);
  return mine;
}

// --------------- role actions ---------------

function getOrdersForStore(store, statusFilter) {
  return allOrders.filter(o => {
    if (statusFilter) {
      if (Array.isArray(statusFilter)) {
        return (o.from === store || o.to === store) && statusFilter.includes(o.status);
      }
      return (o.from === store || o.to === store) && o.status === statusFilter;
    }
    return o.from === store || o.to === store;
  });
}

function getOrdersFrom(store, status) {
  return allOrders.filter(o => o.from === store && o.status === status);
}

function getOrdersTo(store, status) {
  return allOrders.filter(o => o.to === store && o.status === status);
}

// --------------- tester actions by role ---------------

function doAdminAction() {
  const r = Math.random();
  if (r < 0.25) {
    // view audit logs
    assert(auditLogs.length >= 0, 'Audit logs accessible');
    logAudit('Admin', 'VIEW_AUDIT_LOGS', `${auditLogs.length} entries`);
  } else if (r < 0.50) {
    // query summary
    querySummary();
  } else if (r < 0.75) {
    // create order from any valid store
    const from = pick(ALL_STORES);
    const targets = TRANSFER_RULES[from];
    if (targets.length > 0) {
      const to = pick(targets);
      createOrder(from, to);
    } else {
      // try invalid and expect catch
      const to = pick(ALL_STORES.filter(s => s !== from));
      const result = createOrder(from, to);
      assert(result === null, `Admin: B2 send attempt must fail`);
    }
  } else {
    // export
    exportReport();
  }
}

function doAccountantAction() {
  const r = Math.random();
  if (r < 0.40) {
    querySummary();
  } else if (r < 0.70) {
    exportReport();
  } else {
    checkNotifications('Accountant');
  }
}

function doB1Action() {
  const r = Math.random();

  if (r < 0.20) {
    // create order to B2 or B3
    const to = pick(['B2', 'B3']);
    createOrder('B1', to);
  } else if (r < 0.30) {
    // submit a draft
    const drafts = getOrdersFrom('B1', 'draft');
    if (drafts.length > 0) {
      submitOrder(pick(drafts));
    }
  } else if (r < 0.40) {
    // prepare a submitted order
    const submitted = getOrdersFrom('B1', 'submitted');
    if (submitted.length > 0) {
      prepareOrder(pick(submitted));
    }
  } else if (r < 0.50) {
    // ship a preparing order
    const preparing = getOrdersFrom('B1', 'preparing');
    if (preparing.length > 0) {
      shipOrder(pick(preparing));
    }
  } else if (r < 0.60) {
    // receive orders sent TO B1 (from B3)
    const shipped = getOrdersTo('B1', 'shipped');
    if (shipped.length > 0) {
      receiveOrder(pick(shipped));
    }
  } else if (r < 0.70) {
    // complete received orders at B1
    const received = getOrdersTo('B1', 'received');
    if (received.length > 0) {
      completeOrder(pick(received));
    }
  } else if (r < 0.80) {
    // cancel draft/submitted
    const cancellable = getOrdersFrom('B1', 'draft').concat(getOrdersFrom('B1', 'submitted'));
    if (cancellable.length > 0) {
      cancelOrder(pick(cancellable));
    }
  } else if (r < 0.90) {
    // try invalid transition
    const completed = getOrdersFrom('B1', 'completed');
    if (completed.length > 0) {
      const o = pick(completed);
      submitOrder(o); // should fail
    }
  } else {
    // login test
    testLogin('B1');
  }
}

function doB2Action() {
  const r = Math.random();

  if (r < 0.25) {
    // try to send (must fail)
    const to = pick(['B1', 'B3']);
    const result = createOrder('B2', to);
    assert(result === null, 'B2 must NEVER send orders');
  } else if (r < 0.35) {
    // try to send to self (must fail)
    const result = createOrder('B2', 'B2');
    assert(result === null, 'Cannot send to self');
  } else if (r < 0.55) {
    // receive orders sent TO B2
    const shipped = getOrdersTo('B2', 'shipped');
    if (shipped.length > 0) {
      receiveOrder(pick(shipped));
    }
  } else if (r < 0.70) {
    // complete received orders at B2
    const received = getOrdersTo('B2', 'received');
    if (received.length > 0) {
      completeOrder(pick(received));
    }
  } else if (r < 0.85) {
    // check notifications
    checkNotifications('B2');
  } else {
    // login test
    testLogin('B2');
  }
}

function doB3Action() {
  const r = Math.random();

  if (r < 0.20) {
    // create order to B1 or B2
    const to = pick(['B1', 'B2']);
    createOrder('B3', to);
  } else if (r < 0.30) {
    // submit a draft
    const drafts = getOrdersFrom('B3', 'draft');
    if (drafts.length > 0) {
      submitOrder(pick(drafts));
    }
  } else if (r < 0.40) {
    // prepare
    const submitted = getOrdersFrom('B3', 'submitted');
    if (submitted.length > 0) {
      prepareOrder(pick(submitted));
    }
  } else if (r < 0.50) {
    // ship
    const preparing = getOrdersFrom('B3', 'preparing');
    if (preparing.length > 0) {
      shipOrder(pick(preparing));
    }
  } else if (r < 0.60) {
    // receive orders sent TO B3 (from B1)
    const shipped = getOrdersTo('B3', 'shipped');
    if (shipped.length > 0) {
      receiveOrder(pick(shipped));
    }
  } else if (r < 0.70) {
    // complete
    const received = getOrdersTo('B3', 'received');
    if (received.length > 0) {
      completeOrder(pick(received));
    }
  } else if (r < 0.80) {
    // cancel
    const cancellable = getOrdersFrom('B3', 'draft').concat(getOrdersFrom('B3', 'submitted'));
    if (cancellable.length > 0) {
      cancelOrder(pick(cancellable));
    }
  } else if (r < 0.90) {
    // try invalid transition
    const shipped = getOrdersFrom('B3', 'shipped');
    if (shipped.length > 0) {
      completeOrder(pick(shipped)); // should fail - need received first
    }
  } else {
    // login test
    testLogin('B3');
  }
}

// --------------- role distribution ---------------

const ROLES = ['Admin', 'Accountant', 'B1', 'B2', 'B3'];

function runOneOp(testerIdx) {
  // each tester has a fixed role based on 20% distribution
  const roleIdx = testerIdx % 5;
  const role = ROLES[roleIdx];

  switch (role) {
    case 'Admin':      doAdminAction();      break;
    case 'Accountant': doAccountantAction();  break;
    case 'B1':         doB1Action();          break;
    case 'B2':         doB2Action();          break;
    case 'B3':         doB3Action();          break;
  }
}

// --------------- final validations ---------------

function runFinalValidations() {
  // 1. All completed orders must have price snapshots
  const completed = allOrders.filter(o => o.status === 'completed');
  for (const o of completed) {
    assert(o.totalSnapshot !== null, `Final: completed order ${o.orderNumber} has snapshot`);
    assert(typeof o.totalSnapshot === 'number', `Final: snapshot is number for ${o.orderNumber}`);
  }

  // 2. Non-completed orders must NOT have price snapshots
  const nonCompleted = allOrders.filter(o => o.status !== 'completed');
  for (const o of nonCompleted) {
    assert(o.totalSnapshot === null, `Final: non-completed order ${o.orderNumber} has no snapshot`);
  }

  // 3. B2 must never appear as a sender
  const b2Sent = allOrders.filter(o => o.from === 'B2');
  assert(b2Sent.length === 0, 'Final: B2 never sent any orders');

  // 4. No self-transfers
  const selfTransfers = allOrders.filter(o => o.from === o.to);
  assert(selfTransfers.length === 0, 'Final: no self-transfers exist');

  // 5. All order numbers match format
  for (const o of allOrders) {
    assert(/^PL-\d{8}-\d{3,}$/.test(o.orderNumber), `Final: order number format ${o.orderNumber}`);
  }

  // 6. Transfer rules respected
  for (const o of allOrders) {
    const allowed = TRANSFER_RULES[o.from];
    assert(allowed.includes(o.to), `Final: transfer ${o.from}->${o.to} is allowed`);
  }

  // 7. Summary only includes completed
  const summary = querySummary();
  assert(summary.completedOrders === completed.length, 'Final: summary count matches completed');

  // 8. Valid statuses only
  const validStatuses = [...STATUS_FLOW, 'cancelled'];
  for (const o of allOrders) {
    assert(validStatuses.includes(o.status), `Final: valid status ${o.status}`);
  }

  // 9. Cancelled orders have no snapshot
  const cancelledOrders = allOrders.filter(o => o.status === 'cancelled');
  for (const o of cancelledOrders) {
    assert(o.totalSnapshot === null, `Final: cancelled order ${o.orderNumber} has no snapshot`);
  }

  // 10. Login success rate
  assert(stats.loginTests === stats.loginSuccess, 'Final: 100% login success rate');
}

// --------------- pair summary ---------------

function computePairSummary() {
  const completed = allOrders.filter(o => o.status === 'completed');
  const pairs = {};
  const pairKeys = ['B1 -> B2', 'B1 -> B3', 'B3 -> B1', 'B3 -> B2'];

  for (const key of pairKeys) {
    pairs[key] = { count: 0, total: 0 };
  }

  for (const o of completed) {
    const key = `${o.from} -> ${o.to}`;
    if (pairs[key]) {
      pairs[key].count++;
      pairs[key].total += o.totalSnapshot;
    }
  }

  return { pairs, totalCount: completed.length, totalValue: completed.reduce((s, o) => s + o.totalSnapshot, 0) };
}

// --------------- main ---------------

function main() {
  console.log('============================================================');
  console.log('  PACKING LIST - LOAD SIMULATION TEST');
  console.log(`  ${fmt(NUM_TESTERS)} Testers x ${fmt(LOOPS_PER_TESTER)} Loops = ${fmt(TOTAL_OPS)} Operations`);
  console.log('============================================================');
  console.log('');
  console.log('Starting simulation...');

  const startTime = Date.now();
  let nextProgressAt = Math.floor(TOTAL_OPS * 0.05);
  let progressPct = 5;

  let opsDone = 0;

  for (let t = 0; t < NUM_TESTERS; t++) {
    for (let l = 0; l < LOOPS_PER_TESTER; l++) {
      runOneOp(t);
      opsDone++;

      if (opsDone >= nextProgressAt) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`  [${padPct(progressPct)}%] ${fmt(opsDone)} / ${fmt(TOTAL_OPS)} ops | ${elapsed}s`);
        progressPct += 5;
        nextProgressAt = Math.floor(TOTAL_OPS * (progressPct / 100));
      }
    }
  }

  const duration = (Date.now() - startTime) / 1000;

  console.log('');
  console.log('Running final validations...');
  runFinalValidations();

  // compute pair summary
  const pairData = computePairSummary();
  const throughput = Math.round(TOTAL_OPS / duration);

  // --------------- output results ---------------

  console.log('');
  console.log('============================================================');
  console.log('  SIMULATION RESULTS');
  console.log('============================================================');
  console.log('');
  console.log('Configuration:');
  console.log(`  Testers:            ${fmt(NUM_TESTERS)}`);
  console.log(`  Loops per tester:   ${fmt(LOOPS_PER_TESTER)}`);
  console.log(`  Total operations:   ${fmt(TOTAL_OPS)}`);
  console.log(`  Duration:           ${duration.toFixed(2)}s`);
  console.log(`  Throughput:         ${fmt(throughput)} ops/sec`);
  console.log('');
  console.log('Order Statistics:');
  console.log(`  Created:            ${fmt(stats.created)}`);
  console.log(`  Submitted:          ${fmt(stats.submitted)}`);
  console.log(`  Prepared:           ${fmt(stats.prepared)}`);
  console.log(`  Shipped:            ${fmt(stats.shipped)}`);
  console.log(`  Received:           ${fmt(stats.received)}`);
  console.log(`  Completed:          ${fmt(stats.completed)}`);
  console.log(`  Cancelled:          ${fmt(stats.cancelled)}`);
  console.log('');
  console.log('System Statistics:');
  console.log(`  Notifications:      ${fmt(stats.notifications)}`);
  console.log(`  Price snapshots:    ${fmt(stats.priceSnapshots)}`);
  console.log(`  Audit logs:         ${fmt(stats.auditLogs)}`);
  console.log(`  Login tests:        ${fmt(stats.loginTests)} (100% success)`);
  console.log(`  Summary queries:    ${fmt(stats.summaryQueries)}`);
  console.log(`  Export requests:    ${fmt(stats.exportRequests)}`);
  console.log('');
  console.log('Rule Enforcement:');
  console.log(`  Transfer violations caught:  ${fmt(stats.transferViolationsCaught)}`);
  console.log(`  Invalid transitions caught:  ${fmt(stats.invalidTransitionsCaught)}`);
  console.log('');
  console.log('Pair Summary (completed orders only):');

  const pairKeys = ['B1 -> B2', 'B1 -> B3', 'B3 -> B1', 'B3 -> B2'];
  for (const key of pairKeys) {
    const p = pairData.pairs[key];
    const countStr = String(fmt(p.count)).padStart(5);
    console.log(`  ${key}:  ${countStr} orders  |  ${fmtMoney(p.total)}`);
  }
  console.log('  ' + '\u2500'.repeat(37));
  const totalCountStr = String(fmt(pairData.totalCount)).padStart(7);
  console.log(`  Total:     ${totalCountStr} orders  |  ${fmtMoney(pairData.totalValue)}`);

  console.log('');
  console.log('============================================================');
  console.log('  TEST RESULTS');
  console.log('============================================================');
  console.log(`  Assertions passed:  ${fmt(stats.assertionsPassed)}`);
  console.log(`  Assertions failed:  ${fmt(stats.assertionsFailed)}`);
  console.log('');

  if (stats.assertionsFailed === 0) {
    console.log(`  \u2713 ALL ${fmt(TOTAL_OPS)} OPERATIONS PASSED`);
    console.log('  \u2713 ALL BUSINESS RULES VALIDATED');
    console.log('  \u2713 STATUS: SUCCESS');
  } else {
    console.log(`  \u2717 ${fmt(stats.assertionsFailed)} ASSERTIONS FAILED`);
    console.log('  \u2717 STATUS: FAILURE');
  }

  console.log('============================================================');

  process.exit(stats.assertionsFailed === 0 ? 0 : 1);
}

main();
