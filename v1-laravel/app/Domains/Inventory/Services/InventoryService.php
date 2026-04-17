<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\Item;
use Illuminate\Database\Eloquent\Collection;

class InventoryService
{
    public function getActiveItems(): Collection
    {
        return Item::active()->orderBy('code')->get();
    }

    public function searchItems(string $query): Collection
    {
        return Item::active()
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('code', 'like', "%{$query}%");
            })
            ->orderBy('code')
            ->get();
    }

    public function getItemsByCategory(string $category): Collection
    {
        return Item::active()->where('category', $category)->orderBy('code')->get();
    }

    public function getCurrentPrice(Item $item): ?float
    {
        return $item->getCurrentPriceValue();
    }

    public function createItem(array $data): Item
    {
        return Item::create($data);
    }

    public function updateItem(Item $item, array $data): Item
    {
        $item->update($data);
        return $item;
    }

    public function deactivateItem(Item $item): Item
    {
        $item->update(['active' => false]);
        return $item;
    }
}
