<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name', 150);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('vendor_item_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->string('vendor_item_name', 255);
            $table->string('normalized_name', 255);
            $table->foreignId('raw_material_id')->nullable()->constrained('raw_materials')->nullOnDelete();
            $table->enum('match_status', ['matched', 'unmatched', 'pending'])->default('pending');
            $table->timestamps();
        });

        Schema::create('google_drive_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->foreignId('store_id')->nullable()->constrained('stores')->nullOnDelete();
            $table->string('folder_id', 255);
            $table->string('folder_name', 255);
            $table->string('folder_url', 500)->nullable();
            $table->boolean('active')->default(true);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('scan_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->unsignedSmallInteger('month');
            $table->unsignedSmallInteger('year');
            $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->unsignedInteger('total_files')->default(0);
            $table->unsignedInteger('parsed_files')->default(0);
            $table->unsignedInteger('failed_files')->default(0);
            $table->unsignedInteger('matched_items')->default(0);
            $table->unsignedInteger('updated_prices')->default(0);
            $table->unsignedInteger('kept_old_prices')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });

        Schema::create('scan_job_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scan_job_id')->constrained('scan_jobs')->cascadeOnDelete();
            $table->string('file_name', 255);
            $table->string('file_type', 50)->nullable();
            $table->string('file_url', 500)->nullable();
            $table->enum('parse_status', ['pending', 'success', 'failed', 'skipped'])->default('pending');
            $table->string('vendor_name_parsed', 255)->nullable();
            $table->string('invoice_number_parsed', 100)->nullable();
            $table->date('invoice_date_parsed')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });

        Schema::create('scan_job_price_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scan_job_id')->constrained('scan_jobs')->cascadeOnDelete();
            $table->foreignId('scan_job_file_id')->constrained('scan_job_files')->cascadeOnDelete();
            $table->foreignId('raw_material_id')->nullable()->constrained('raw_materials')->nullOnDelete();
            $table->string('raw_item_name', 255);
            $table->string('unit', 50)->nullable();
            $table->decimal('old_price', 10, 2)->nullable();
            $table->decimal('new_price', 10, 2)->nullable();
            $table->enum('action', ['updated', 'kept', 'skipped', 'unmatched'])->default('unmatched');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scan_job_price_updates');
        Schema::dropIfExists('scan_job_files');
        Schema::dropIfExists('scan_jobs');
        Schema::dropIfExists('google_drive_configs');
        Schema::dropIfExists('vendor_item_mappings');
        Schema::dropIfExists('vendors');
    }
};
