<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('store')->orderBy('name')->paginate(20);
        return Inertia::render('Users/Index', compact('users'));
    }

    public function create()
    {
        $stores = Store::active()->get();
        $roles = config('packinglist.roles');
        return Inertia::render('Users/Create', compact('stores', 'roles'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users',
            'password' => ['required', 'confirmed', Password::min(6)],
            'role' => 'required|in:admin,b1,b2,b3,accountant',
            'store_id' => 'nullable|exists:stores,id',
        ]);

        $data['password'] = Hash::make($data['password']);
        User::create($data);

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    public function edit(User $user)
    {
        $stores = Store::active()->get();
        $roles = config('packinglist.roles');
        return Inertia::render('Users/Edit', compact('user', 'stores', 'roles'));
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users,email,' . $user->id,
            'password' => ['nullable', 'confirmed', Password::min(6)],
            'role' => 'required|in:admin,b1,b2,b3,accountant',
            'store_id' => 'nullable|exists:stores,id',
            'active' => 'boolean',
        ]);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);
        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }
}
