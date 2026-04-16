<!DOCTYPE html>
<html lang="en" class="h-full bg-gray-50">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login - Packing List</title>
    @vite(['resources/css/app.css'])
</head>
<body class="h-full">
<div class="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-bold text-gray-900">Packing List</h2>
        <p class="mt-2 text-center text-sm text-gray-600">Sign in to your account</p>
    </div>
    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            @if($errors->any())
            <div class="mb-4 rounded-md bg-red-50 p-4">
                <ul class="list-disc list-inside text-sm text-red-800">
                    @foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach
                </ul>
            </div>
            @endif
            <form method="POST" action="/login" class="space-y-6">
                @csrf
                <div>
                    <label for="email" class="label">Email</label>
                    <input id="email" name="email" type="email" required value="{{ old('email') }}" class="input-field" autofocus>
                </div>
                <div>
                    <label for="password" class="label">Password</label>
                    <input id="password" name="password" type="password" required class="input-field">
                </div>
                <div class="flex items-center">
                    <input id="remember" name="remember" type="checkbox" class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                    <label for="remember" class="ml-2 text-sm text-gray-900">Remember me</label>
                </div>
                <button type="submit" class="btn-primary w-full justify-center">Sign in</button>
            </form>
            <div class="mt-6">
                <p class="text-xs text-gray-500 text-center">Test accounts:</p>
                <div class="mt-2 text-xs text-gray-500 space-y-1">
                    <p>admin@packinglist.com / b1@packinglist.com / b2@packinglist.com</p>
                    <p>b3@packinglist.com / accountant@packinglist.com</p>
                    <p>Password: <code class="bg-gray-100 px-1 rounded">password</code></p>
                </div>
            </div>
        </div>
    </div>
</div>
</body>
</html>
