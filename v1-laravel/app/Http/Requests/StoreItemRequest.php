<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->isAdmin();
    }

    public function rules(): array
    {
        $itemId = $this->route('item')?->id;

        return [
            'code' => 'required|string|max:20|unique:items,code' . ($itemId ? ",{$itemId}" : ''),
            'name' => 'required|string|max:150',
            'unit' => 'required|string|max:30',
            'category' => 'nullable|string|max:50',
            'active' => 'boolean',
        ];
    }
}
