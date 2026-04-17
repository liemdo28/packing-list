<?php

namespace App\Domains\Packing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PackingTemplateItem extends Model
{
    protected $fillable = ['packing_template_id', 'item_id', 'default_qty'];

    protected $casts = ['default_qty' => 'decimal:3'];

    public function template(): BelongsTo
    {
        return $this->belongsTo(PackingTemplate::class, 'packing_template_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(\App\Domains\Inventory\Models\Item::class);
    }
}