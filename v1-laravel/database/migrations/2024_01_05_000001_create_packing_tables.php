<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('packing_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['shipment', 'transfer', 'event'])->default('shipment');
            $table->enum('status', ['draft', 'packing', 'packed', 'shipped'])->default('draft');
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->foreignId('from_store_id')->nullable()->constrained('stores')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('packing_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('packing_job_id')->constrained('packing_jobs')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->decimal('quantity', 10, 3)->default(0);
            $table->decimal('packed_qty', 10, 3)->default(0);
            $table->boolean('packed')->default(false);
            $table->timestamp('packed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('packing_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('created_by')->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('packing_template_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('packing_template_id')->constrained('packing_templates')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->decimal('default_qty', 10, 3)->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packing_template_items');
        Schema::dropIfExists('packing_templates');
        Schema::dropIfExists('packing_items');
        Schema::dropIfExists('packing_jobs');
    }
};
