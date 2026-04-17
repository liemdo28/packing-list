<?php

namespace App\Domains\InvoiceScan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends Model
{
    protected $fillable = ['code', 'name', 'active'];

    protected $casts = ['active' => 'boolean'];

    public function vendorItemMappings(): HasMany
    {
        return $this->hasMany(VendorItemMapping::class);
    }

    public function googleDriveConfigs(): HasMany
    {
        return $this->hasMany(GoogleDriveConfig::class);
    }

    public function scanJobs(): HasMany
    {
        return $this->hasMany(ScanJob::class);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
