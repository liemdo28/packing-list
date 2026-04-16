@extends('layouts.app')
@section('title', 'Users')

@section('content')
<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
    <h2 class="text-2xl font-bold text-gray-900">Users</h2>
    <a href="{{ route('users.create') }}" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">Add User</a>
</div>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Email</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Role</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Store</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                @forelse($users as $user)
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium text-gray-900">{{ $user->name }}</td>
                    <td class="px-4 py-3 text-gray-500 hidden sm:table-cell">{{ $user->email }}</td>
                    <td class="px-4 py-3">
                        <x-badge :color="$user->role === 'admin' ? 'purple' : ($user->role === 'accountant' ? 'blue' : 'gray')">{{ ucfirst($user->role) }}</x-badge>
                    </td>
                    <td class="px-4 py-3 text-gray-500 hidden md:table-cell">{{ $user->store->name ?? '-' }}</td>
                    <td class="px-4 py-3">
                        <x-badge :color="$user->active ? 'green' : 'red'">{{ $user->active ? 'Active' : 'Inactive' }}</x-badge>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex space-x-2">
                            <a href="{{ route('users.edit', $user) }}" class="text-blue-600 hover:text-blue-800 text-sm">Edit</a>
                            @if($user->id !== auth()->id())
                            <form method="POST" action="{{ route('users.destroy', $user) }}" onsubmit="return confirm('Delete/deactivate this user?')">
                                @csrf @method('DELETE')
                                <button type="submit" class="text-red-600 hover:text-red-800 text-sm">Delete</button>
                            </form>
                            @endif
                        </div>
                    </td>
                </tr>
                @empty
                <tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No users found.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="px-4 py-3 border-t">{{ $users->links() }}</div>
</div>
@endsection
