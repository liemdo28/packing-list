<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoogleDriveConfig extends Model
{
    protected $fillable = [
        'vendor_id', 'store_id', 'folder_id', 'folder_name',
        'folder_url', 'active', 'notes', 'created_by',
    ];

    protected $casts = ['active' => 'boolean'];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
