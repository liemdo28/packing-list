<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->route('order')->status === 'draft';
    }

    public function rules(): array
    {
        return [
            'to_store_id' => 'required|exists:stores,id',
            'notes' => 'nullable|string|max:1000',
            'lines' => 'required|array|min:1',
            'lines.*.item_id' => 'required|exists:items,id',
            'lines.*.requested_qty' => 'required|numeric|min:0.01',
            'lines.*.notes' => 'nullable|string|max:500',
        ];
    }
}
