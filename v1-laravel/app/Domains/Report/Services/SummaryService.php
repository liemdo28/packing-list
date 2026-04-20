<?php

namespace App\Domains\Report\Services;

use App\Domains\Order\Models\Order;
use App\Domains\Invoice\Models\MonthlySummary;
use App\Domains\User\Models\Store;
use Illuminate\Support\Facades\DB;

class SummaryService
{
    /**
     * Get overview stats for a given year/month.
     */
    public function getOverview(int $year, int $month): array
    {
        $baseQuery = Order::completed()
            ->whereYear('completed_at', $year)
            ->whereMonth('completed_at', $month);

        $totalCompleted = (clone $baseQuery)->count();

        $totalItems = DB::table('orders')
            ->join('order_lines', 'orders.id', '=', 'order_lines.order_id')
            ->where('orders.status', 'completed')
            ->whereYear('orders.completed_at', $year)
            ->whereMonth('orders.completed_at', $month)
            ->count();

        $totalAmount = DB::table('orders')
            ->join('order_lines', 'orders.id', '=', 'order_lines.order_id')
            ->where('orders.status', 'completed')
            ->whereYear('orders.completed_at', $year)
            ->whereMonth('orders.completed_at', $month)
            ->sum('order_lines.line_total');

        $pendingOrders = Order::whereIn('status', ['submitted', 'processing', 'ready_to_ship', 'in_transit', 'received_pending_confirmation'])
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->count();

        $adjustedOrders = DB::table('orders')
            ->join('order_lines', 'orders.id', '=', 'order_lines.order_id')
            ->where('orders.status', 'completed')
            ->whereYear('orders.completed_at', $year)
            ->whereMonth('orders.completed_at', $month)
            ->whereColumn('order_lines.final_qty', '!=', 'order_lines.requested_qty')
            ->distinct('orders.id')
            ->count('orders.id');

        // Per-store breakdown
        $byStore = DB::table('orders')
            ->join('order_lines', 'orders.id', '=', 'order_lines.order_id')
            ->join('stores as fs', 'orders.from_store_id', '=', 'fs.id')
            ->join('stores as ts', 'orders.to_store_id', '=', 'ts.id')
            ->where('orders.status', 'completed')
            ->whereYear('orders.completed_at', $year)
            ->whereMonth('orders.completed_at', $month)
            ->select(
                DB::raw("CONCAT(fs.code, ' → ', ts.code) as store"),
                DB::raw('COUNT(DISTINCT orders.id) as orders'),
                DB::raw('COALESCE(SUM(order_lines.line_total), 0) as amount')
            )
            ->groupBy('orders.from_store_id', 'orders.to_store_id', 'fs.code', 'ts.code')
            ->orderBy('fs.code')
            ->get()
            ->toArray();

        return [
            'totalCompleted' => $totalCompleted,
            'totalItems' => $totalItems,
            'totalAmount' => round($totalAmount, 2),
            'pendingOrders' => $pendingOrders,
            'adjustedOrders' => $adjustedOrders,
            'byStore' => $byStore,
        ];
    }

    /**
     * Get monthly summary data for a specific pair (item-level aggregation).
     */
    public function getMonthlySummary(int $year, int $month, ?string $pair = null): array
    {
        $query = DB::table('orders')
            ->join('order_lines', 'orders.id', '=', 'order_lines.order_id')
            ->join('items', 'order_lines.item_id', '=', 'items.id')
            ->where('orders.status', 'completed')
            ->whereYear('orders.completed_at', $year)
            ->whereMonth('orders.completed_at', $month);

        if ($pair) {
            [$fromCode, $toCode] = explode('-', $pair);
            $fromStore = Store::where('code', $fromCode)->first();
            $toStore = Store::where('code', $toCode)->first();
            if ($fromStore && $toStore) {
                $query->where(function ($q) use ($fromStore, $toStore) {
                    $q->where(function ($q2) use ($fromStore, $toStore) {
                        $q2->where('orders.from_store_id', $fromStore->id)
                           ->where('orders.to_store_id', $toStore->id);
                    })->orWhere(function ($q2) use ($fromStore, $toStore) {
                        $q2->where('orders.from_store_id', $toStore->id)
                           ->where('orders.to_store_id', $fromStore->id);
                    });
                });
            }
        }

        $items = $query->select(
                'items.name as item_name',
                'items.unit',
                DB::raw('SUM(order_lines.final_qty) as total_qty'),
                DB::raw('AVG(order_lines.unit_price) as unit_price'),
                DB::raw('SUM(order_lines.line_total) as total')
            )
            ->groupBy('items.id', 'items.name', 'items.unit')
            ->orderBy('items.name')
            ->get()
            ->toArray();

        $grandTotal = array_sum(array_column($items, 'total'));

        return [
            'items' => $items,
            'grand_total' => round($grandTotal, 2),
        ];
    }

    /**
     * Get detailed orders with line items for a specific pair (drill-down).
     */
    public function getPairDetail(int $year, int $month, int $store1Id, int $store2Id): array
    {
        $orders = Order::completed()
            ->whereYear('completed_at', $year)
            ->whereMonth('completed_at', $month)
            ->where(function ($q) use ($store1Id, $store2Id) {
                $q->where(function ($q2) use ($store1Id, $store2Id) {
                    $q2->where('from_store_id', $store1Id)
                       ->where('to_store_id', $store2Id);
                })->orWhere(function ($q2) use ($store1Id, $store2Id) {
                    $q2->where('from_store_id', $store2Id)
                       ->where('to_store_id', $store1Id);
                });
            })
            ->with(['fromStore', 'toStore', 'lines.item'])
            ->orderByDesc('completed_at')
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'from_store' => $order->fromStore->code,
                    'to_store' => $order->toStore->code,
                    'completed_at' => $order->completed_at->format('Y-m-d'),
                    'total' => $order->getTotalAmount(),
                    'lines' => $order->lines->map(function ($line) {
                        return [
                            'item_name' => $line->item->name ?? '-',
                            'unit' => $line->item->unit ?? '-',
                            'requested_qty' => $line->requested_qty,
                            'final_qty' => $line->final_qty,
                            'unit_price' => $line->unit_price,
                            'line_total' => $line->line_total,
                        ];
                    }),
                ];
            })
            ->toArray();

        return $orders;
    }

    /**
     * Get yearly per-item, per-month quantity grid.
     */
    public function getYearlyStats(int $year, ?string $pair = null): array
    {
        $query = DB::table('orders')
            ->join('order_lines', 'orders.id', '=', 'order_lines.order_id')
            ->join('items', 'order_lines.item_id', '=', 'items.id')
            ->where('orders.status', 'completed')
            ->whereYear('orders.completed_at', $year);

        if ($pair) {
            [$fromCode, $toCode] = explode('-', $pair);
            $fromStore = Store::where('code', $fromCode)->first();
            $toStore = Store::where('code', $toCode)->first();
            if ($fromStore && $toStore) {
                $query->where(function ($q) use ($fromStore, $toStore) {
                    $q->where(function ($q2) use ($fromStore, $toStore) {
                        $q2->where('orders.from_store_id', $fromStore->id)
                           ->where('orders.to_store_id', $toStore->id);
                    })->orWhere(function ($q2) use ($fromStore, $toStore) {
                        $q2->where('orders.from_store_id', $toStore->id)
                           ->where('orders.to_store_id', $fromStore->id);
                    });
                });
            }
        }

        $rows = $query->select(
                'items.id as item_id',
                'items.name as item_name',
                'items.unit',
                DB::raw('MONTH(orders.completed_at) as month'),
                DB::raw('SUM(order_lines.final_qty) as total_qty')
            )
            ->groupBy('items.id', 'items.name', 'items.unit', DB::raw('MONTH(orders.completed_at)'))
            ->orderBy('items.name')
            ->get();

        // Pivot: group by item, spread months 1-12
        $pivoted = [];
        foreach ($rows as $row) {
            $key = $row->item_id;
            if (!isset($pivoted[$key])) {
                $pivoted[$key] = [
                    'item_name' => $row->item_name,
                    'unit' => $row->unit,
                    'months' => array_fill(1, 12, 0),
                    'total' => 0,
                ];
            }
            $qty = round((float)$row->total_qty, 2);
            $pivoted[$key]['months'][$row->month] = $qty;
            $pivoted[$key]['total'] += $qty;
        }

        // Round totals
        foreach ($pivoted as &$item) {
            $item['total'] = round($item['total'], 2);
        }

        return array_values($pivoted);
    }

    /**
     * Legacy method kept for backward compatibility with ExportService.
     */
    public function getYearlySummary(int $year): array
    {
        $summary = DB::table('orders')
            ->join('order_lines', 'orders.id', '=', 'order_lines.order_id')
            ->where('orders.status', 'completed')
            ->whereYear('orders.completed_at', $year)
            ->select(
                DB::raw('MONTH(orders.completed_at) as month'),
                'orders.from_store_id',
                'orders.to_store_id',
                DB::raw('COUNT(DISTINCT orders.id) as total_orders'),
                DB::raw('SUM(order_lines.line_total) as total_amount')
            )
            ->groupBy(DB::raw('MONTH(orders.completed_at)'), 'orders.from_store_id', 'orders.to_store_id')
            ->orderBy('month')
            ->get();

        return [
            'year' => $year,
            'summary' => $summary,
            'grand_total' => $summary->sum('total_amount'),
        ];
    }

    /**
     * Legacy method kept for backward compatibility.
     */
    public function getPairSummary(int $year, int $month, int $store1Id, int $store2Id): array
    {
        $forward = DB::table('orders')
            ->join('order_lines', 'orders.id', '=', 'order_lines.order_id')
            ->where('orders.status', 'completed')
            ->whereYear('orders.completed_at', $year)
            ->whereMonth('orders.completed_at', $month)
            ->where('orders.from_store_id', $store1Id)
            ->where('orders.to_store_id', $store2Id)
            ->select(
                DB::raw('COUNT(DISTINCT orders.id) as total_orders'),
                DB::raw('COALESCE(SUM(order_lines.line_total), 0) as total_amount')
            )
            ->first();

        $reverse = DB::table('orders')
            ->join('order_lines', 'orders.id', '=', 'order_lines.order_id')
            ->where('orders.status', 'completed')
            ->whereYear('orders.completed_at', $year)
            ->whereMonth('orders.completed_at', $month)
            ->where('orders.from_store_id', $store2Id)
            ->where('orders.to_store_id', $store1Id)
            ->select(
                DB::raw('COUNT(DISTINCT orders.id) as total_orders'),
                DB::raw('COALESCE(SUM(order_lines.line_total), 0) as total_amount')
            )
            ->first();

        return [
            'forward' => $forward,
            'reverse' => $reverse,
            'net' => ($forward->total_amount ?? 0) - ($reverse->total_amount ?? 0),
        ];
    }
}
