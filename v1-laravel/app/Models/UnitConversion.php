<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UnitConversion extends Model
{
    protected $fillable = ['from_unit', 'to_unit', 'multiplier', 'notes', 'active'];

    protected $casts = [
        'multiplier' => 'decimal:6',
        'active' => 'boolean',
    ];

    /**
     * Convert a value from one unit to another.
     * Returns null if no conversion found.
     */
    public static function convert(float $value, string $fromUnit, string $toUnit): ?float
    {
        if ($fromUnit === $toUnit) {
            return $value;
        }

        $conversion = static::where('from_unit', $fromUnit)
            ->where('to_unit', $toUnit)
            ->where('active', true)
            ->first();

        if ($conversion) {
            return $value * (float) $conversion->multiplier;
        }

        // Try reverse conversion
        $reverse = static::where('from_unit', $toUnit)
            ->where('to_unit', $fromUnit)
            ->where('active', true)
            ->first();

        if ($reverse && (float) $reverse->multiplier != 0) {
            return $value / (float) $reverse->multiplier;
        }

        return null;
    }

    /**
     * Check if conversion between two units is possible.
     */
    public static function canConvert(string $fromUnit, string $toUnit): bool
    {
        if ($fromUnit === $toUnit) {
            return true;
        }

        return static::where(function ($q) use ($fromUnit, $toUnit) {
            $q->where('from_unit', $fromUnit)->where('to_unit', $toUnit);
        })->orWhere(function ($q) use ($fromUnit, $toUnit) {
            $q->where('from_unit', $toUnit)->where('to_unit', $fromUnit);
        })->where('active', true)->exists();
    }
}
