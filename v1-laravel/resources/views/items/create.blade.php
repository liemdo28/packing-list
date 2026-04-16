@extends('layouts.app')
@section('title', 'Add Item')

@section('content')
<div class="max-w-2xl mx-auto">
    <div class="mb-6">
        <a href="{{ route('items.index') }}" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Items</a>
        <h2 class="text-2xl font-bold text-gray-900 mt-2">Add Item</h2>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form method="POST" action="{{ route('items.store') }}">
            @csrf
            <div class="space-y-4">
                <div>
                    <label for="code" class="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
                    <input type="text" name="code" id="code" value="{{ old('code') }}" required maxlength="20"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                </div>
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" name="name" id="name" value="{{ old('name') }}" required maxlength="150"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label for="unit" class="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                        <input type="text" name="unit" id="unit" value="{{ old('unit', 'pcs') }}" required maxlength="30"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                    </div>
                    <div>
                        <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <input type="text" name="category" id="category" value="{{ old('category') }}" maxlength="50"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                    </div>
                </div>
                <div class="flex items-center">
                    <input type="hidden" name="active" value="0">
                    <input type="checkbox" name="active" id="active" value="1" {{ old('active', true) ? 'checked' : '' }}
                           class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <label for="active" class="ml-2 text-sm text-gray-700">Active</label>
                </div>
            </div>
            <div class="flex justify-end mt-6 space-x-3">
                <a href="{{ route('items.index') }}" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</a>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Item</button>
            </div>
        </form>
    </div>
</div>
@endsection
