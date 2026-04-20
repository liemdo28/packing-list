<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // New workflow timestamps for extended 10-status lifecycle
            if (!Schema::hasColumn('orders', 'processing_at')) {
                $table->timestamp('processing_at')->nullable()->after('submitted_at');
            }
            if (!Schema::hasColumn('orders', 'ready_at')) {
                $table->timestamp('ready_at')->nullable()->after('processing_at');
            }

            // Additional indexes for query performance under load
            // Covers: WHERE status = 'completed' ORDER BY completed_at DESC
            $table->index(['status', 'completed_at'], 'idx_orders_status_completed');

            // Covers: WHERE status = 'completed' AND YEAR(completed_at) = ?
            //         AND MONTH(completed_at) = ?
            $table->index(['status', DB::raw('YEAR(completed_at)'), DB::raw('MONTH(completed_at)')],
                'idx_orders_status_year_month');
        });

        Schema::table('order_lines', function (Blueprint $table) {
            // Covers: SUM(line_total) aggregation in monthly summaries
            if (!Schema::hasIndex('order_lines', 'idx_order_lines_line_total')) {
                $table->index('line_total', 'idx_order_lines_line_total');
            }
        });

        Schema::table('monthly_summaries', function (Blueprint $table) {
            // Covers: WHERE year = ? AND month = ? for fast summary lookup
            if (!Schema::hasIndex('monthly_summaries', 'idx_monthly_year_month')) {
                $table->index(['year', 'month'], 'idx_monthly_year_month');
            }
        });

        // Update the status enum to include all 10 statuses.
        // MySQL ENUM cannot be altered with ALTER COLUMN safely for all cases,
        // so we use DB::statement for explicit type mapping.
        DB::statement("ALTER TABLE orders MODIFY COLUMN status
            ENUM('draft','submitted','processing','ready_to_ship','in_transit',
                 'received_pending_confirmation','completed','cancelled','disputed')
            DEFAULT 'draft'");
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_status_completed');
            $table->dropIndex('idx_orders_status_year_month');
            $table->dropColumn(['processing_at', 'ready_at']);
        });

        Schema::table('order_lines', function (Blueprint $table) {
            $table->dropIndex('idx_order_lines_line_total');
        });

        Schema::table('monthly_summaries', function (Blueprint $table) {
            $table->dropIndex('idx_monthly_year_month');
        });

        // Revert enum to original 7 statuses
        DB::statement("ALTER TABLE orders MODIFY COLUMN status
            ENUM('draft','submitted','preparing','shipped','received','completed','cancelled')
            DEFAULT 'draft'");
    }
};
