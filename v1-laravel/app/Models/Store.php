<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Store extends Model
{
    protected $fillable = ['code', 'name', 'address', 'phone', 'active'];

    protected $casts = ['active' => 'boolean'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function outgoingOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'from_store_id');
    }

    public function incomingOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'to_store_id');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function getAllowedDestinations(): array
    {
        return config('packinglist.transfer_rules')[$this->code] ?? [];
    }

    public function canSendTo(Store $destination): bool
    {
        return in_array($destination->code, $this->getAllowedDestinations());
    }
}
