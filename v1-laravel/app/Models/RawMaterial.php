<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RawMaterial extends Model
{
    protected $fillable = ['code', 'name', 'base_unit', 'category', 'active'];

    protected $casts = ['active' => 'boolean'];

    public function prices(): HasMany
    {
        return $this->hasMany(RawMaterialPrice::class);
    }

    public function recipeLines(): HasMany
    {
        return $this->hasMany(RecipeLine::class);
    }

    public function latestPrice(): ?RawMaterialPrice
    {
        return $this->prices()
            ->where('active', true)
            ->orderByDesc('effective_date')
            ->first();
    }

    public function getCurrentPrice(): float
    {
        return (float) ($this->latestPrice()?->unit_price ?? 0);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
