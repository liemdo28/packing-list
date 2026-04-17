<?php

namespace App\Domains\Order\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'to_store_id' => 'required|exists:stores,id',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|in:draft,submitted',
            'lines' => 'required|array|min:1',
            'lines.*.item_id' => 'required|exists:items,id',
            'lines.*.requested_qty' => 'required|numeric|min:0.01',
            'lines.*.notes' => 'nullable|string|max:500',
        ];

        return $rules;
    }

    public function messages(): array
    {
        return [
            'lines.required' => 'At least one item line is required.',
            'lines.min' => 'At least one item line is required.',
            'lines.*.item_id.required' => 'Each line must have an item selected.',
            'lines.*.requested_qty.required' => 'Each line must have a quantity.',
            'lines.*.requested_qty.min' => 'Quantity must be at least 0.01.',
        ];
    }
}
