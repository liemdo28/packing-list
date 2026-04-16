@extends('layouts.app')
@section('title', 'Edit Store')

@section('content')
<div class="max-w-2xl mx-auto">
    <div class="mb-6">
        <a href="{{ route('stores.index') }}" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Stores</a>
        <h2 class="text-2xl font-bold text-gray-900 mt-2">Edit Store: {{ $store->name }}</h2>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form method="POST" action="{{ route('stores.update', $store) }}">
            @csrf @method('PUT')
            <div class="space-y-4">
                <div>
                    <label for="code" class="block text-sm font-medium text-gray-700 mb-1">Store Code</label>
                    <input type="text" name="code" id="code" value="{{ old('code', $store->code) }}" required maxlength="10"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                </div>
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" name="name" id="name" value="{{ old('name', $store->name) }}" required maxlength="100"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                </div>
                <div>
                    <label for="address" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea name="address" id="address" rows="2"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">{{ old('address', $store->address) }}</textarea>
                </div>
                <div>
                    <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="text" name="phone" id="phone" value="{{ old('phone', $store->phone) }}" maxlength="20"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                </div>
                <div class="flex items-center">
                    <input type="hidden" name="active" value="0">
                    <input type="checkbox" name="active" id="active" value="1" {{ old('active', $store->active) ? 'checked' : '' }}
                           class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <label for="active" class="ml-2 text-sm text-gray-700">Active</label>
                </div>
            </div>
            <div class="flex justify-end mt-6 space-x-3">
                <a href="{{ route('stores.index') }}" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</a>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Update Store</button>
            </div>
        </form>
    </div>
</div>
@endsection
