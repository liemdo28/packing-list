<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_summaries', function (Blueprint $table) {
            $table->id();
            $table->integer('year');
            $table->integer('month');
            $table->foreignId('from_store_id')->constrained('stores');
            $table->foreignId('to_store_id')->constrained('stores');
            $table->integer('total_orders')->default(0);
            $table->decimal('total_amount', 14, 2)->default(0);
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();
            $table->unique(['year', 'month', 'from_store_id', 'to_store_id'], 'monthly_summary_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_summaries');
    }
};
