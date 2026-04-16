<!DOCTYPE html>
<html lang="en" class="h-full bg-gray-100">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Packing List')</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="h-full" x-data="{ sidebarOpen: false }">
<div class="min-h-full">
    <div x-show="sidebarOpen" class="fixed inset-0 z-40 bg-gray-600/75 lg:hidden" @click="sidebarOpen=false"></div>
    <div :class="sidebarOpen?'translate-x-0':'-translate-x-full'" class="fixed inset-y-0 left-0 z-50 w-64 bg-primary-800 transform transition-transform lg:translate-x-0 lg:static">
        <div class="flex items-center justify-between h-16 px-4 bg-primary-900">
            <span class="text-xl font-bold text-white">Packing List</span>
            <button @click="sidebarOpen=false" class="lg:hidden text-white">&times;</button>
        </div>
        <nav class="mt-4 px-2 space-y-1">
            <a href="/dashboard" class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-primary-100 hover:bg-primary-700">Dashboard</a>
            <a href="/orders" class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-primary-100 hover:bg-primary-700">Orders</a>
            <a href="/notifications" class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-primary-100 hover:bg-primary-700">Notifications</a>
            @role('admin', 'accountant')
            <a href="/summary" class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-primary-100 hover:bg-primary-700">Summary</a>
            <a href="/invoices" class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-primary-100 hover:bg-primary-700">Invoices</a>
            @endrole
            @role('admin')
            <div class="pt-4"><p class="px-3 text-xs font-semibold text-primary-300 uppercase">Admin</p></div>
            <a href="/stores" class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-primary-100 hover:bg-primary-700">Stores</a>
            <a href="/items" class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-primary-100 hover:bg-primary-700">Items</a>
            <a href="/prices" class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-primary-100 hover:bg-primary-700">Prices</a>
            <a href="/users" class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-primary-100 hover:bg-primary-700">Users</a>
            <a href="/audit-logs" class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-primary-100 hover:bg-primary-700">Audit Logs</a>
            @endrole
        </nav>
    </div>
    <div class="lg:pl-64">
        <div class="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:px-6">
            <button @click="sidebarOpen=true" class="lg:hidden text-gray-500">&#9776;</button>
            <div class="flex flex-1 items-center justify-between">
                <h1 class="text-lg font-semibold text-gray-900">@yield('title', 'Dashboard')</h1>
                <div class="flex items-center gap-x-4" x-data="{open:false}">
                    <button @click="open=!open" class="text-sm font-medium text-gray-700">
                        {{ auth()->user()->name }}
                        <span class="ml-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-800">{{ strtoupper(auth()->user()->role) }}</span>
                    </button>
                    <div x-show="open" @click.outside="open=false" class="absolute right-4 top-14 w-48 bg-white rounded-md shadow-lg ring-1 ring-black/5 z-50">
                        <form method="POST" action="/logout">@csrf
                            <button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign out</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <main class="py-6 px-4 sm:px-6 lg:px-8">
            @if(session('success'))<div class="mb-4 rounded-md bg-green-50 p-4"><p class="text-sm text-green-800">{{ session('success') }}</p></div>@endif
            @if(session('error'))<div class="mb-4 rounded-md bg-red-50 p-4"><p class="text-sm text-red-800">{{ session('error') }}</p></div>@endif
            @if($errors->any())<div class="mb-4 rounded-md bg-red-50 p-4"><ul class="list-disc list-inside text-sm text-red-800">@foreach($errors->all() as $e)<li>{{ $e }}</li>@endforeach</ul></div>@endif
            @yield('content')
        </main>
    </div>
</div>
</body>
</html>
