<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items');
            $table->decimal('requested_qty', 10, 2);
            $table->decimal('shipped_qty', 10, 2)->nullable();
            $table->decimal('received_qty', 10, 2)->nullable();
            $table->decimal('unit_price', 12, 2)->nullable();
            $table->decimal('line_total', 14, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_lines');
    }
};
