<?php

namespace App\Domains\User\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->isAdmin();
    }

    public function rules(): array
    {
        $storeId = $this->route('store')?->id;

        return [
            'code' => 'required|string|max:10|unique:stores,code' . ($storeId ? ",{$storeId}" : ''),
            'name' => 'required|string|max:100',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'active' => 'boolean',
        ];
    }
}
