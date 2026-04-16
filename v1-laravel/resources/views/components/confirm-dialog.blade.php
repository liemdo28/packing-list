@props([
    'id' => 'confirm-dialog',
    'title' => 'Confirm Action',
    'message' => 'Are you sure you want to proceed?',
    'confirmText' => 'Confirm',
    'cancelText' => 'Cancel',
    'confirmColor' => 'red',
    'action' => '',
    'method' => 'POST',
])

<div x-data="{ open: false }" x-cloak>
    <div @click="open = true">
        {{ $trigger ?? '' }}
    </div>

    <div x-show="open" class="fixed inset-0 z-50 overflow-y-auto" x-transition:enter="ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" x-transition:leave="ease-in duration-200" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0">
        <div class="flex items-center justify-center min-h-screen px-4">
            <div class="fixed inset-0 bg-black/50" @click="open = false"></div>

            <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6" x-transition:enter="ease-out duration-300" x-transition:enter-start="opacity-0 translate-y-4" x-transition:enter-end="opacity-100 translate-y-0">
                <div class="flex items-center mb-4">
                    @if($confirmColor === 'red')
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                    </div>
                    @endif
                    <h3 class="text-lg font-semibold text-gray-900">{{ $title }}</h3>
                </div>

                <p class="text-sm text-gray-600 mb-6">{{ $message }}</p>

                {{ $slot }}

                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" @click="open = false" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        {{ $cancelText }}
                    </button>
                    @if($action)
                    <form method="POST" action="{{ $action }}">
                        @csrf
                        @if($method === 'DELETE')
                        @method('DELETE')
                        @endif
                        {{ $hiddenFields ?? '' }}
                        <button type="submit" class="px-4 py-2 text-sm font-medium text-white rounded-lg
                            {{ $confirmColor === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700' }}">
                            {{ $confirmText }}
                        </button>
                    </form>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
