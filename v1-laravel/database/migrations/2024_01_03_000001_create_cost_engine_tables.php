<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raw_materials', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name', 150);
            $table->string('base_unit', 20);
            $table->string('category', 50)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('raw_material_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('raw_material_id')->constrained('raw_materials')->cascadeOnDelete();
            $table->string('vendor_name', 100)->nullable();
            $table->string('unit', 20);
            $table->decimal('unit_price', 10, 2);
            $table->date('effective_date');
            $table->enum('source', ['manual', 'invoice'])->default('manual');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('unit_conversions', function (Blueprint $table) {
            $table->id();
            $table->string('from_unit', 20);
            $table->string('to_unit', 20);
            $table->decimal('multiplier', 12, 6);
            $table->string('notes', 255)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['from_unit', 'to_unit']);
        });

        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->string('name', 150);
            $table->integer('version')->default(1);
            $table->decimal('output_qty', 10, 2)->default(1);
            $table->string('output_unit', 20);
            $table->decimal('labor_hours', 8, 2)->default(0);
            $table->decimal('labor_rate', 8, 2)->default(16.00);
            $table->decimal('waste_percent', 5, 2)->default(0);
            $table->decimal('markup_percent', 5, 2)->default(30);
            $table->boolean('active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('recipe_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained('recipes')->cascadeOnDelete();
            $table->foreignId('raw_material_id')->constrained('raw_materials')->cascadeOnDelete();
            $table->decimal('qty_required', 10, 4);
            $table->string('unit', 20);
            $table->integer('sort_order')->default(0);
            $table->string('notes', 255)->nullable();
            $table->timestamps();
        });

        Schema::create('cost_calculations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->foreignId('recipe_id')->constrained('recipes')->cascadeOnDelete();
            $table->timestamp('calculated_at');
            $table->decimal('total_ingredient_cost', 12, 2)->default(0);
            $table->decimal('labor_cost', 12, 2)->default(0);
            $table->decimal('waste_amount', 12, 2)->default(0);
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('markup_amount', 12, 2)->default(0);
            $table->decimal('final_cost', 12, 2)->default(0);
            $table->decimal('cost_per_unit', 12, 2)->default(0);
            $table->enum('status', ['draft', 'approved', 'archived'])->default('draft');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cost_calculations');
        Schema::dropIfExists('recipe_lines');
        Schema::dropIfExists('recipes');
        Schema::dropIfExists('unit_conversions');
        Schema::dropIfExists('raw_material_prices');
        Schema::dropIfExists('raw_materials');
    }
};
