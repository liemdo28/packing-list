<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->isAdmin();
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        $rules = [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'role' => ['required', Rule::in(array_keys(config('packinglist.roles')))],
            'store_id' => 'nullable|exists:stores,id',
            'active' => 'boolean',
        ];

        if ($isUpdate) {
            $rules['password'] = 'nullable|string|min:8|confirmed';
        } else {
            $rules['password'] = 'required|string|min:8|confirmed';
        }

        return $rules;
    }
}
