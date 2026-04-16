@extends('layouts.app')
@section('title', 'Audit Logs')

@section('content')
<div class="mb-6">
    <h2 class="text-2xl font-bold text-gray-900">Audit Logs</h2>
</div>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
    <form method="GET" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <select name="user_id" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Users</option>
            @foreach($users as $user)
            <option value="{{ $user->id }}" {{ ($filters['user_id'] ?? '') == $user->id ? 'selected' : '' }}>{{ $user->name }}</option>
            @endforeach
        </select>
        <select name="action" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Actions</option>
            @foreach($actions as $action)
            <option value="{{ $action }}" {{ ($filters['action'] ?? '') === $action ? 'selected' : '' }}>{{ ucfirst($action) }}</option>
            @endforeach
        </select>
        <select name="table_name" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Tables</option>
            @foreach($tables as $table)
            <option value="{{ $table }}" {{ ($filters['table_name'] ?? '') === $table ? 'selected' : '' }}>{{ $table }}</option>
            @endforeach
        </select>
        <input type="date" name="date_from" value="{{ $filters['date_from'] ?? '' }}" placeholder="From date"
               class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
        <input type="date" name="date_to" value="{{ $filters['date_to'] ?? '' }}" placeholder="To date"
               class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
        <div class="flex space-x-2">
            <button type="submit" class="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900">Filter</button>
            <a href="{{ route('audit-logs.index') }}" class="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Clear</a>
        </div>
    </form>
</div>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">User</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Action</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Table</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Record</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500 hidden lg:table-cell">Changes</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                @forelse($logs as $log)
                <tr class="hover:bg-gray-50" x-data="{ expanded: false }">
                    <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ $log->created_at->format('d M Y H:i:s') }}</td>
                    <td class="px-4 py-3 text-gray-700">{{ $log->user->name ?? 'System' }}</td>
                    <td class="px-4 py-3">
                        <x-badge :color="match($log->action) { 'created' => 'green', 'updated' => 'blue', 'deleted' => 'red', default => 'gray' }">{{ ucfirst($log->action) }}</x-badge>
                    </td>
                    <td class="px-4 py-3 text-gray-700">{{ $log->table_name }}</td>
                    <td class="px-4 py-3 text-gray-500 hidden md:table-cell">#{{ $log->record_id }}</td>
                    <td class="px-4 py-3 hidden lg:table-cell">
                        @if($log->new_values)
                        <button @click="expanded = !expanded" class="text-blue-600 hover:text-blue-800 text-xs">
                            <span x-text="expanded ? 'Hide' : 'Show'"></span> details
                        </button>
                        <div x-show="expanded" x-cloak class="mt-2 text-xs bg-gray-50 rounded p-2 max-w-xs overflow-auto">
                            @if($log->old_values)
                            <p class="font-medium text-red-600">Old:</p>
                            <pre class="text-gray-600">{{ json_encode($log->old_values, JSON_PRETTY_PRINT) }}</pre>
                            @endif
                            <p class="font-medium text-green-600 mt-1">New:</p>
                            <pre class="text-gray-600">{{ json_encode($log->new_values, JSON_PRETTY_PRINT) }}</pre>
                        </div>
                        @else
                        <span class="text-gray-400">-</span>
                        @endif
                    </td>
                </tr>
                @empty
                <tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No audit logs found.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="px-4 py-3 border-t">{{ $logs->withQueryString()->links() }}</div>
</div>
@endsection
