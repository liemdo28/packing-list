<?php

namespace App\Domains\Packing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PackingTemplate extends Model
{
    protected $fillable = ['name', 'description', 'created_by'];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Domains\User\Models\User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PackingTemplateItem::class, 'packing_template_id');
    }
}