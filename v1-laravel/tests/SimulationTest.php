<?php
/**
 * Packing List - Load Simulation Test
 *
 * Standalone PHP script (no Laravel, no database).
 * Simulates 500 virtual testers x 100 loops = 50,000 operations.
 *
 * Usage: php tests/SimulationTest.php
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const NUM_TESTERS = 500;
const NUM_LOOPS   = 100;
const TOTAL_OPS   = NUM_TESTERS * NUM_LOOPS;

// Transfer rules: sender => [allowed receivers]
const TRANSFER_RULES = [
    'B1' => ['B2', 'B3'],
    'B2' => [],            // B2 can NEVER send
    'B3' => ['B1', 'B2'],
];

// Valid status transitions (current => [next, ...])
const STATUS_FLOW = [
    'draft'     => ['submitted'],
    'submitted' => ['preparing'],
    'preparing' => ['shipped'],
    'shipped'   => ['received'],
    'received'  => ['completed'],
    'completed' => [],
];

// Statuses from which cancellation is allowed
const CANCELLABLE_FROM = ['draft', 'submitted'];

// All possible roles a tester can assume
const ROLES = ['admin', 'accountant', 'B1', 'B2', 'B3'];

// Branches that can send orders
const SENDER_BRANCHES = ['B1', 'B3'];

// All branches
const ALL_BRANCHES = ['B1', 'B2', 'B3'];

// ---------------------------------------------------------------------------
// Global state
// ---------------------------------------------------------------------------
$orders          = [];
$nextOrderId     = 1;
$auditLogs       = [];
$notifications   = [];
$priceSnapshots  = [];

// Counters
$stats = [
    'created'       => 0,
    'submitted'     => 0,
    'preparing'     => 0,
    'shipped'       => 0,
    'received'      => 0,
    'completed'     => 0,
    'cancelled'     => 0,
    'notifications' => 0,
    'snapshots'     => 0,
    'audit_logs'    => 0,
    'exports'       => 0,
    'summaries'     => 0,
    'send_blocked'  => 0,
];

// Pair tracking
$pairStats = [
    'B1->B2' => ['count' => 0, 'total' => 0.0],
    'B1->B3' => ['count' => 0, 'total' => 0.0],
    'B3->B1' => ['count' => 0, 'total' => 0.0],
    'B3->B2' => ['count' => 0, 'total' => 0.0],
];

// Assertions
$assertionsPassed = 0;
$assertionsFailed = 0;
$failureMessages  = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assert_true(bool $condition, string $message, int &$passed, int &$failed, array &$failures): void
{
    if ($condition) {
        $passed++;
    } else {
        $failed++;
        $failures[] = $message;
    }
}

function addAuditLog(array &$auditLogs, array &$stats, string $actor, string $action, string $detail): void
{
    $auditLogs[] = [
        'actor'  => $actor,
        'action' => $action,
        'detail' => $detail,
        'ts'     => microtime(true),
    ];
    $stats['audit_logs']++;
}

function addNotification(array &$notifications, array &$stats, string $to, string $message): void
{
    $notifications[] = [
        'to'      => $to,
        'message' => $message,
        'ts'      => microtime(true),
    ];
    $stats['notifications']++;
}

function randomPrice(): float
{
    return round(mt_rand(100, 99999) / 100, 2);
}

function randomQty(): int
{
    return mt_rand(1, 500);
}

function pickRandom(array $arr)
{
    return $arr[array_rand($arr)];
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Create a new order from a sender branch to a valid receiver.
 */
function actionCreateOrder(
    string $branch,
    array &$orders,
    int &$nextOrderId,
    array &$auditLogs,
    array &$notifications,
    array &$stats,
    array &$pairStats,
    int &$passed,
    int &$failed,
    array &$failures
): void {
    $receivers = TRANSFER_RULES[$branch] ?? [];

    // B2 should have no receivers
    if ($branch === 'B2') {
        assert_true(
            empty($receivers),
            "B2 must have no allowed receivers",
            $passed, $failed, $failures
        );
        $stats['send_blocked']++;
        addAuditLog($auditLogs, $stats, $branch, 'send_blocked', "B2 attempted to create order — blocked");
        return;
    }

    assert_true(
        !empty($receivers),
        "Sender {$branch} must have allowed receivers",
        $passed, $failed, $failures
    );

    $receiver = pickRandom($receivers);

    // Cannot send to self
    assert_true(
        $receiver !== $branch,
        "Cannot send order to self ({$branch}->{$receiver})",
        $passed, $failed, $failures
    );

    $numItems = mt_rand(1, 5);
    $items = [];
    for ($i = 0; $i < $numItems; $i++) {
        $items[] = [
            'name'        => "Item-" . mt_rand(1000, 9999),
            'qty'         => randomQty(),
            'shipped_qty' => 0,
            'unit_price'  => randomPrice(),
        ];
    }

    $orderId = $nextOrderId++;
    $orders[$orderId] = [
        'id'       => $orderId,
        'sender'   => $branch,
        'receiver' => $receiver,
        'status'   => 'draft',
        'items'    => $items,
        'total'    => null,   // only set at completion
    ];

    $stats['created']++;
    $pairKey = "{$branch}->{$receiver}";
    if (isset($pairStats[$pairKey])) {
        $pairStats[$pairKey]['count']++;
    }

    addAuditLog($auditLogs, $stats, $branch, 'create_order', "Order #{$orderId} {$pairKey}");
    addNotification($notifications, $stats, $receiver, "New draft order #{$orderId} from {$branch}");

    assert_true(
        $orders[$orderId]['status'] === 'draft',
        "Newly created order #{$orderId} must be draft",
        $passed, $failed, $failures
    );
}

/**
 * Try to submit a draft order.
 */
function actionSubmitOrder(
    string $actor,
    array &$orders,
    array &$auditLogs,
    array &$notifications,
    array &$stats,
    int &$passed,
    int &$failed,
    array &$failures
): void {
    $drafts = array_filter($orders, fn($o) => $o['status'] === 'draft' && $o['sender'] === $actor);
    if (empty($drafts)) {
        return;
    }

    $order = &$orders[pickRandom(array_keys($drafts))];

    // Validate transition
    assert_true(
        in_array('submitted', STATUS_FLOW[$order['status']]),
        "Order #{$order['id']} can transition draft->submitted",
        $passed, $failed, $failures
    );

    $order['status'] = 'submitted';
    $stats['submitted']++;

    addAuditLog($auditLogs, $stats, $actor, 'submit_order', "Order #{$order['id']}");
    addNotification($notifications, $stats, $order['receiver'], "Order #{$order['id']} submitted by {$actor}");

    assert_true(
        $order['status'] === 'submitted',
        "Order #{$order['id']} status must be submitted",
        $passed, $failed, $failures
    );
}

/**
 * Prepare an order (enter shipped_qty).
 */
function actionPrepareOrder(
    string $actor,
    array &$orders,
    array &$auditLogs,
    array &$notifications,
    array &$stats,
    int &$passed,
    int &$failed,
    array &$failures
): void {
    $submitted = array_filter($orders, fn($o) => $o['status'] === 'submitted' && $o['sender'] === $actor);
    if (empty($submitted)) {
        return;
    }

    $order = &$orders[pickRandom(array_keys($submitted))];

    assert_true(
        in_array('preparing', STATUS_FLOW[$order['status']]),
        "Order #{$order['id']} can transition submitted->preparing",
        $passed, $failed, $failures
    );

    // Fill shipped_qty for each item
    foreach ($order['items'] as &$item) {
        $item['shipped_qty'] = mt_rand(0, $item['qty']);
    }
    unset($item);

    $order['status'] = 'preparing';
    $stats['preparing']++;

    addAuditLog($auditLogs, $stats, $actor, 'prepare_order', "Order #{$order['id']} — shipped_qty entered");
    addNotification($notifications, $stats, $order['receiver'], "Order #{$order['id']} is being prepared");

    assert_true(
        $order['status'] === 'preparing',
        "Order #{$order['id']} status must be preparing",
        $passed, $failed, $failures
    );
}

/**
 * Ship an order.
 */
function actionShipOrder(
    string $actor,
    array &$orders,
    array &$auditLogs,
    array &$notifications,
    array &$stats,
    int &$passed,
    int &$failed,
    array &$failures
): void {
    $preparing = array_filter($orders, fn($o) => $o['status'] === 'preparing' && $o['sender'] === $actor);
    if (empty($preparing)) {
        return;
    }

    $order = &$orders[pickRandom(array_keys($preparing))];

    assert_true(
        in_array('shipped', STATUS_FLOW[$order['status']]),
        "Order #{$order['id']} can transition preparing->shipped",
        $passed, $failed, $failures
    );

    $order['status'] = 'shipped';
    $stats['shipped']++;

    addAuditLog($auditLogs, $stats, $actor, 'ship_order', "Order #{$order['id']}");
    addNotification($notifications, $stats, $order['receiver'], "Order #{$order['id']} shipped by {$actor}");

    assert_true(
        $order['status'] === 'shipped',
        "Order #{$order['id']} status must be shipped",
        $passed, $failed, $failures
    );
}

/**
 * Receive an incoming order (receiver action).
 */
function actionReceiveOrder(
    string $actor,
    array &$orders,
    array &$auditLogs,
    array &$notifications,
    array &$stats,
    int &$passed,
    int &$failed,
    array &$failures
): void {
    $shipped = array_filter($orders, fn($o) => $o['status'] === 'shipped' && $o['receiver'] === $actor);
    if (empty($shipped)) {
        return;
    }

    $order = &$orders[pickRandom(array_keys($shipped))];

    assert_true(
        in_array('received', STATUS_FLOW[$order['status']]),
        "Order #{$order['id']} can transition shipped->received",
        $passed, $failed, $failures
    );

    $order['status'] = 'received';
    $stats['received']++;

    addAuditLog($auditLogs, $stats, $actor, 'receive_order', "Order #{$order['id']}");
    addNotification($notifications, $stats, $order['sender'], "Order #{$order['id']} received by {$actor}");

    assert_true(
        $order['status'] === 'received',
        "Order #{$order['id']} status must be received",
        $passed, $failed, $failures
    );
}

/**
 * Complete an order — price snapshot happens HERE.
 */
function actionCompleteOrder(
    string $actor,
    array &$orders,
    array &$auditLogs,
    array &$notifications,
    array &$priceSnapshots,
    array &$stats,
    array &$pairStats,
    int &$passed,
    int &$failed,
    array &$failures
): void {
    $received = array_filter($orders, fn($o) => $o['status'] === 'received' && $o['receiver'] === $actor);
    if (empty($received)) {
        return;
    }

    $order = &$orders[pickRandom(array_keys($received))];

    assert_true(
        in_array('completed', STATUS_FLOW[$order['status']]),
        "Order #{$order['id']} can transition received->completed",
        $passed, $failed, $failures
    );

    // Price snapshot at completion
    $total = 0.0;
    foreach ($order['items'] as $item) {
        $total += $item['shipped_qty'] * $item['unit_price'];
    }
    $total = round($total, 2);
    $order['total'] = $total;

    $priceSnapshots[] = [
        'order_id' => $order['id'],
        'total'    => $total,
        'ts'       => microtime(true),
    ];
    $stats['snapshots']++;

    $order['status'] = 'completed';
    $stats['completed']++;

    $pairKey = "{$order['sender']}->{$order['receiver']}";
    if (isset($pairStats[$pairKey])) {
        $pairStats[$pairKey]['total'] += $total;
    }

    addAuditLog($auditLogs, $stats, $actor, 'complete_order', "Order #{$order['id']} total=\${$total}");
    addNotification($notifications, $stats, $order['sender'], "Order #{$order['id']} completed by {$actor}");

    assert_true(
        $order['status'] === 'completed',
        "Order #{$order['id']} status must be completed",
        $passed, $failed, $failures
    );
    assert_true(
        $order['total'] !== null,
        "Completed order #{$order['id']} must have a price snapshot",
        $passed, $failed, $failures
    );
}

/**
 * Cancel an order (only from draft or submitted).
 */
function actionCancelOrder(
    string $actor,
    array &$orders,
    array &$auditLogs,
    array &$notifications,
    array &$stats,
    int &$passed,
    int &$failed,
    array &$failures
): void {
    $cancellable = array_filter(
        $orders,
        fn($o) => in_array($o['status'], CANCELLABLE_FROM) && $o['sender'] === $actor
    );
    if (empty($cancellable)) {
        return;
    }

    $order = &$orders[pickRandom(array_keys($cancellable))];

    assert_true(
        in_array($order['status'], CANCELLABLE_FROM),
        "Order #{$order['id']} can only be cancelled from draft/submitted (was {$order['status']})",
        $passed, $failed, $failures
    );

    $prevStatus = $order['status'];
    $order['status'] = 'cancelled';
    $stats['cancelled']++;

    addAuditLog($auditLogs, $stats, $actor, 'cancel_order', "Order #{$order['id']} from {$prevStatus}");
    addNotification($notifications, $stats, $order['receiver'], "Order #{$order['id']} cancelled by {$actor}");

    assert_true(
        $order['status'] === 'cancelled',
        "Order #{$order['id']} status must be cancelled",
        $passed, $failed, $failures
    );
    assert_true(
        $order['total'] === null,
        "Cancelled order #{$order['id']} must NOT have a price snapshot",
        $passed, $failed, $failures
    );
}

/**
 * B2 tries to send an order — must always fail.
 */
function actionB2TrySend(
    array &$orders,
    int &$nextOrderId,
    array &$auditLogs,
    array &$notifications,
    array &$stats,
    array &$pairStats,
    int &$passed,
    int &$failed,
    array &$failures
): void {
    $receivers = TRANSFER_RULES['B2'];
    assert_true(
        empty($receivers),
        "B2 transfer rules must be empty",
        $passed, $failed, $failures
    );

    $stats['send_blocked']++;
    addAuditLog($auditLogs, $stats, 'B2', 'send_blocked', "B2 attempted to send — correctly blocked");

    // Verify no order was created by B2 as sender
    // (This is a meta-assertion checked globally at the end as well.)
}

/**
 * View audit logs (admin action).
 */
function actionViewAuditLogs(
    array &$auditLogs,
    array &$stats,
    int &$passed,
    int &$failed,
    array &$failures
): void {
    // Simulate reading audit logs — just verify they exist as an array
    assert_true(
        is_array($auditLogs),
        "Audit logs must be an array",
        $passed, $failed, $failures
    );
    addAuditLog($auditLogs, $stats, 'admin', 'view_audit', "Admin viewed audit logs (" . count($auditLogs) . " entries)");
}

/**
 * Query summary — only completed orders count.
 */
function actionQuerySummary(
    string $actor,
    array &$orders,
    array &$auditLogs,
    array &$stats,
    int &$passed,
    int &$failed,
    array &$failures
): void {
    $completedOrders = array_filter($orders, fn($o) => $o['status'] === 'completed');
    $summaryTotal = 0.0;
    foreach ($completedOrders as $o) {
        $summaryTotal += $o['total'] ?? 0;
    }

    // Verify every order in the summary is completed
    foreach ($completedOrders as $o) {
        assert_true(
            $o['status'] === 'completed',
            "Summary must only include completed orders (#{$o['id']})",
            $passed, $failed, $failures
        );
        assert_true(
            $o['total'] !== null,
            "Completed order #{$o['id']} in summary must have a total",
            $passed, $failed, $failures
        );
    }

    $stats['summaries']++;
    addAuditLog($auditLogs, $stats, $actor, 'query_summary', "Summary: " . count($completedOrders) . " orders, \$" . number_format($summaryTotal, 2));
}

/**
 * Export action (admin/accountant).
 */
function actionExport(
    string $actor,
    array &$auditLogs,
    array &$stats,
    int &$passed,
    int &$failed,
    array &$failures
): void {
    $stats['exports']++;
    addAuditLog($auditLogs, $stats, $actor, 'export', "Data exported by {$actor}");

    assert_true(
        in_array($actor, ['admin', 'accountant']),
        "Only admin/accountant can export (was {$actor})",
        $passed, $failed, $failures
    );
}

/**
 * View notifications.
 */
function actionViewNotifications(
    string $actor,
    array &$notifications,
    array &$auditLogs,
    array &$stats,
    int &$passed,
    int &$failed,
    array &$failures
): void {
    $myNotifs = array_filter($notifications, fn($n) => $n['to'] === $actor);
    assert_true(
        is_array($myNotifs),
        "Notifications for {$actor} must be an array",
        $passed, $failed, $failures
    );
    addAuditLog($auditLogs, $stats, $actor, 'view_notifications', "{$actor} viewed " . count($myNotifs) . " notifications");
}

// ---------------------------------------------------------------------------
// Role-weighted action selection
// ---------------------------------------------------------------------------

function getActionsForRole(string $role): array
{
    switch ($role) {
        case 'admin':
            return [
                'view_audit'   => 25,
                'query_summary'=> 25,
                'create_order' => 30,
                'export'       => 20,
            ];
        case 'accountant':
            return [
                'query_summary'     => 40,
                'export'            => 30,
                'view_notifications'=> 30,
            ];
        case 'B1':
        case 'B3':
            return [
                'create_order'  => 25,
                'submit_order'  => 15,
                'prepare_order' => 12,
                'ship_order'    => 12,
                'receive_order' => 12,
                'complete_order'=> 10,
                'cancel_order'  => 8,
                'view_notifications' => 6,
            ];
        case 'B2':
            return [
                'receive_order'      => 30,
                'complete_order'     => 25,
                'view_notifications' => 20,
                'try_send'           => 25,
            ];
        default:
            return [];
    }
}

function pickWeightedAction(array $actions): string
{
    $total = array_sum($actions);
    $rand = mt_rand(1, $total);
    $cumulative = 0;
    foreach ($actions as $action => $weight) {
        $cumulative += $weight;
        if ($rand <= $cumulative) {
            return $action;
        }
    }
    return array_key_first($actions);
}

// ---------------------------------------------------------------------------
// Execute a single action
// ---------------------------------------------------------------------------

function executeAction(
    string $role,
    string $action,
    array &$orders,
    int &$nextOrderId,
    array &$auditLogs,
    array &$notifications,
    array &$priceSnapshots,
    array &$stats,
    array &$pairStats,
    int &$passed,
    int &$failed,
    array &$failures
): void {
    // Determine the branch for branch-specific roles
    $branch = in_array($role, ALL_BRANCHES) ? $role : null;

    switch ($action) {
        case 'create_order':
            // Admin creates orders as a random sender branch
            $sender = $branch ?? pickRandom(SENDER_BRANCHES);
            actionCreateOrder($sender, $orders, $nextOrderId, $auditLogs, $notifications, $stats, $pairStats, $passed, $failed, $failures);
            break;

        case 'submit_order':
            if ($branch) {
                actionSubmitOrder($branch, $orders, $auditLogs, $notifications, $stats, $passed, $failed, $failures);
            }
            break;

        case 'prepare_order':
            if ($branch) {
                actionPrepareOrder($branch, $orders, $auditLogs, $notifications, $stats, $passed, $failed, $failures);
            }
            break;

        case 'ship_order':
            if ($branch) {
                actionShipOrder($branch, $orders, $auditLogs, $notifications, $stats, $passed, $failed, $failures);
            }
            break;

        case 'receive_order':
            $receiver = $branch ?? pickRandom(ALL_BRANCHES);
            actionReceiveOrder($receiver, $orders, $auditLogs, $notifications, $stats, $passed, $failed, $failures);
            break;

        case 'complete_order':
            $receiver = $branch ?? pickRandom(ALL_BRANCHES);
            actionCompleteOrder($receiver, $orders, $auditLogs, $notifications, $priceSnapshots, $stats, $pairStats, $passed, $failed, $failures);
            break;

        case 'cancel_order':
            if ($branch) {
                actionCancelOrder($branch, $orders, $auditLogs, $notifications, $stats, $passed, $failed, $failures);
            }
            break;

        case 'try_send':
            actionB2TrySend($orders, $nextOrderId, $auditLogs, $notifications, $stats, $pairStats, $passed, $failed, $failures);
            break;

        case 'view_audit':
            actionViewAuditLogs($auditLogs, $stats, $passed, $failed, $failures);
            break;

        case 'query_summary':
            $actor = $branch ?? $role;
            actionQuerySummary($actor, $orders, $auditLogs, $stats, $passed, $failed, $failures);
            break;

        case 'export':
            $actor = $branch ?? $role;
            actionExport($actor, $auditLogs, $stats, $passed, $failed, $failures);
            break;

        case 'view_notifications':
            $actor = $branch ?? $role;
            actionViewNotifications($actor, $notifications, $auditLogs, $stats, $passed, $failed, $failures);
            break;
    }
}

// ---------------------------------------------------------------------------
// Final global validations
// ---------------------------------------------------------------------------

function runFinalValidations(
    array &$orders,
    array &$priceSnapshots,
    array &$stats,
    array &$pairStats,
    int &$passed,
    int &$failed,
    array &$failures
): void {
    // 1. B2 must never be a sender
    foreach ($orders as $o) {
        assert_true(
            $o['sender'] !== 'B2',
            "GLOBAL: B2 must never be a sender (order #{$o['id']})",
            $passed, $failed, $failures
        );
    }

    // 2. No order sends to self
    foreach ($orders as $o) {
        assert_true(
            $o['sender'] !== $o['receiver'],
            "GLOBAL: No self-send (order #{$o['id']} {$o['sender']}->{$o['receiver']})",
            $passed, $failed, $failures
        );
    }

    // 3. All sender->receiver pairs follow transfer rules
    foreach ($orders as $o) {
        $allowed = TRANSFER_RULES[$o['sender']] ?? [];
        assert_true(
            in_array($o['receiver'], $allowed),
            "GLOBAL: Transfer rule violated order #{$o['id']} {$o['sender']}->{$o['receiver']}",
            $passed, $failed, $failures
        );
    }

    // 4. Only completed orders have price snapshots (total !== null)
    foreach ($orders as $o) {
        if ($o['status'] === 'completed') {
            assert_true(
                $o['total'] !== null,
                "GLOBAL: Completed order #{$o['id']} must have total",
                $passed, $failed, $failures
            );
        } else {
            assert_true(
                $o['total'] === null,
                "GLOBAL: Non-completed order #{$o['id']} (status={$o['status']}) must NOT have total",
                $passed, $failed, $failures
            );
        }
    }

    // 5. Price snapshot count matches completed order count
    $completedCount = count(array_filter($orders, fn($o) => $o['status'] === 'completed'));
    assert_true(
        count($priceSnapshots) === $completedCount,
        "GLOBAL: Price snapshots (" . count($priceSnapshots) . ") must equal completed orders ({$completedCount})",
        $passed, $failed, $failures
    );

    // 6. No cancelled orders have a price snapshot
    $cancelledWithTotal = array_filter($orders, fn($o) => $o['status'] === 'cancelled' && $o['total'] !== null);
    assert_true(
        empty($cancelledWithTotal),
        "GLOBAL: No cancelled orders should have a price snapshot",
        $passed, $failed, $failures
    );

    // 7. Verify status values are all valid
    $validStatuses = ['draft', 'submitted', 'preparing', 'shipped', 'received', 'completed', 'cancelled'];
    foreach ($orders as $o) {
        assert_true(
            in_array($o['status'], $validStatuses),
            "GLOBAL: Order #{$o['id']} has invalid status '{$o['status']}'",
            $passed, $failed, $failures
        );
    }

    // 8. Summary only includes completed orders
    $summaryOrders = array_filter($orders, fn($o) => $o['status'] === 'completed');
    $summaryTotal = 0.0;
    foreach ($summaryOrders as $o) {
        assert_true(
            $o['total'] !== null && $o['total'] >= 0,
            "GLOBAL: Summary order #{$o['id']} must have non-negative total",
            $passed, $failed, $failures
        );
        $summaryTotal += $o['total'];
    }

    // 9. Pair stats completed totals should be non-negative
    foreach ($pairStats as $pair => $data) {
        assert_true(
            $data['total'] >= 0,
            "GLOBAL: Pair {$pair} total must be non-negative",
            $passed, $failed, $failures
        );
    }

    // 10. Total created orders = sum of all pair counts + orders from admin-created (via sender branches)
    //     All orders should have valid pairs
    $pairOrderSum = 0;
    foreach ($pairStats as $data) {
        $pairOrderSum += $data['count'];
    }
    assert_true(
        $pairOrderSum === count($orders),
        "GLOBAL: Pair order count ({$pairOrderSum}) must equal total orders (" . count($orders) . ")",
        $passed, $failed, $failures
    );

    // 11. Every order with shipped_qty should have it set during preparing or later
    foreach ($orders as $o) {
        $pastPreparing = in_array($o['status'], ['preparing', 'shipped', 'received', 'completed']);
        if ($pastPreparing) {
            foreach ($o['items'] as $item) {
                assert_true(
                    isset($item['shipped_qty']),
                    "GLOBAL: Order #{$o['id']} past preparing must have shipped_qty on items",
                    $passed, $failed, $failures
                );
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Main simulation
// ---------------------------------------------------------------------------

echo "============================================================\n";
echo "  PACKING LIST - LOAD SIMULATION TEST\n";
echo "  " . NUM_TESTERS . " Testers x " . NUM_LOOPS . " Loops = " . number_format(TOTAL_OPS) . " Operations\n";
echo "============================================================\n";
echo "\n";
echo "Starting simulation...\n";

$startTime = microtime(true);
$opsDone = 0;
$nextProgressPct = 5;

for ($tester = 0; $tester < NUM_TESTERS; $tester++) {
    for ($loop = 0; $loop < NUM_LOOPS; $loop++) {
        // Assign random role for this operation
        $role = pickRandom(ROLES);

        // Pick weighted action for this role
        $actions = getActionsForRole($role);
        $action = pickWeightedAction($actions);

        // Execute
        executeAction(
            $role,
            $action,
            $orders,
            $nextOrderId,
            $auditLogs,
            $notifications,
            $priceSnapshots,
            $stats,
            $pairStats,
            $assertionsPassed,
            $assertionsFailed,
            $failureMessages
        );

        $opsDone++;

        // Progress
        $pct = ($opsDone / TOTAL_OPS) * 100;
        if ($pct >= $nextProgressPct) {
            $elapsed = microtime(true) - $startTime;
            printf("  [%d%%] %s/%s ops - %.1fs elapsed\n",
                $nextProgressPct,
                number_format($opsDone),
                number_format(TOTAL_OPS),
                $elapsed
            );
            $nextProgressPct += 5;
        }
    }
}

$elapsed = microtime(true) - $startTime;

echo "\nRunning final validations...\n";

runFinalValidations(
    $orders,
    $priceSnapshots,
    $stats,
    $pairStats,
    $assertionsPassed,
    $assertionsFailed,
    $failureMessages
);

$elapsed = microtime(true) - $startTime;
$opsPerSec = $elapsed > 0 ? TOTAL_OPS / $elapsed : 0;

// ---------------------------------------------------------------------------
// Output results
// ---------------------------------------------------------------------------

echo "\n";
echo "============================================================\n";
echo "  SIMULATION RESULTS\n";
echo "============================================================\n";
echo "\n";
echo "Configuration:\n";
printf("  Testers:          %s\n", number_format(NUM_TESTERS));
printf("  Loops:            %s\n", number_format(NUM_LOOPS));
printf("  Total ops:        %s\n", number_format(TOTAL_OPS));
printf("  Duration:         %.2fs\n", $elapsed);
printf("  Ops/second:       %s\n", number_format((int) $opsPerSec));
echo "\n";
echo "Order Statistics:\n";
printf("  Created:    %s\n", number_format($stats['created']));
printf("  Submitted:  %s\n", number_format($stats['submitted']));
printf("  Preparing:  %s\n", number_format($stats['preparing']));
printf("  Shipped:    %s\n", number_format($stats['shipped']));
printf("  Received:   %s\n", number_format($stats['received']));
printf("  Completed:  %s\n", number_format($stats['completed']));
printf("  Cancelled:  %s\n", number_format($stats['cancelled']));
echo "\n";
echo "System Statistics:\n";
printf("  Notifications:    %s\n", number_format($stats['notifications']));
printf("  Price snapshots:  %s\n", number_format($stats['snapshots']));
printf("  Audit logs:       %s\n", number_format($stats['audit_logs']));
printf("  Exports:          %s\n", number_format($stats['exports']));
printf("  Summaries:        %s\n", number_format($stats['summaries']));
printf("  B2 send blocked:  %s\n", number_format($stats['send_blocked']));
echo "\n";

echo "Pair Summary:\n";
$grandTotal = 0.0;
$totalPairOrders = 0;
foreach ($pairStats as $pair => $data) {
    printf("  %s: %s orders\n", $pair, number_format($data['count']));
    $grandTotal += $data['total'];
    $totalPairOrders += $data['count'];
}
printf("  Total completed value: \$%s\n", number_format($grandTotal, 2));
printf("  Total orders tracked:  %s\n", number_format($totalPairOrders));
echo "\n";

echo "============================================================\n";
echo "  TEST RESULTS\n";
echo "============================================================\n";
printf("  Assertions passed: %s\n", number_format($assertionsPassed));
printf("  Assertions failed: %s\n", number_format($assertionsFailed));
echo "\n";

if ($assertionsFailed > 0) {
    echo "  *** FAILURES ***\n\n";
    $shown = 0;
    foreach ($failureMessages as $msg) {
        echo "  FAIL: {$msg}\n";
        $shown++;
        if ($shown >= 50) {
            echo "  ... and " . ($assertionsFailed - $shown) . " more failures\n";
            break;
        }
    }
    echo "\n";
    echo "============================================================\n";
    exit(1);
}

echo "  *** ALL TESTS PASSED ***\n";
echo "============================================================\n";
exit(0);
