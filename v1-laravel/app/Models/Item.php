<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Item extends Model
{
    protected $fillable = ['code', 'name', 'unit', 'category', 'active'];

    protected $casts = ['active' => 'boolean'];

    public function prices(): HasMany
    {
        return $this->hasMany(PriceMaster::class);
    }

    public function orderLines(): HasMany
    {
        return $this->hasMany(OrderLine::class);
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class);
    }

    public function activeRecipe(): ?Recipe
    {
        return $this->recipes()->where('active', true)->orderByDesc('version')->first();
    }

    public function costCalculations(): HasMany
    {
        return $this->hasMany(CostCalculation::class);
    }

    public function currentPrice(): ?PriceMaster
    {
        return $this->prices()
            ->where('effective_from', '<=', now()->toDateString())
            ->where(function ($q) {
                $q->whereNull('effective_to')
                  ->orWhere('effective_to', '>=', now()->toDateString());
            })
            ->orderByDesc('effective_from')
            ->first();
    }

    public function getCurrentPriceValue(): float
    {
        return $this->currentPrice()?->price ?? 0;
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
