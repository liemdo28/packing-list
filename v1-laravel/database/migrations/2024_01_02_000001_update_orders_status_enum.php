<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update status enum values on orders table
        // Map old statuses to new ones
        DB::table('orders')->where('status', 'preparing')->update(['status' => 'processing']);
        DB::table('orders')->where('status', 'shipped')->update(['status' => 'in_transit']);
        DB::table('orders')->where('status', 'received')->update(['status' => 'received_pending_confirmation']);

        // For SQLite (testing) we can't alter enum, but for MySQL we modify the column
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('draft','submitted','processing','ready_to_ship','in_transit','received_pending_confirmation','completed','cancelled','disputed') NOT NULL DEFAULT 'draft'");
        }

        // Add new timestamp columns to orders
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('processing_at')->nullable()->after('submitted_at');
            $table->timestamp('ready_at')->nullable()->after('processing_at');
        });

        // Add final_qty column to order_lines
        Schema::table('order_lines', function (Blueprint $table) {
            $table->decimal('final_qty', 10, 2)->nullable()->after('received_qty');
        });
    }

    public function down(): void
    {
        // Reverse status mappings
        DB::table('orders')->where('status', 'processing')->update(['status' => 'preparing']);
        DB::table('orders')->where('status', 'ready_to_ship')->update(['status' => 'preparing']);
        DB::table('orders')->where('status', 'in_transit')->update(['status' => 'shipped']);
        DB::table('orders')->where('status', 'received_pending_confirmation')->update(['status' => 'received']);
        DB::table('orders')->where('status', 'disputed')->update(['status' => 'received']);

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('draft','submitted','preparing','shipped','received','completed','cancelled') NOT NULL DEFAULT 'draft'");
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['processing_at', 'ready_at']);
        });

        Schema::table('order_lines', function (Blueprint $table) {
            $table->dropColumn('final_qty');
        });
    }
};
