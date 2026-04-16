@props(['name' => 'modal', 'title' => ''])

<div x-data="{ open: false }"
     x-on:open-{{ $name }}.window="open = true"
     x-on:close-{{ $name }}.window="open = false"
     x-on:keydown.escape.window="open = false">

    <div x-show="open" x-cloak class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen px-4">
            <div x-show="open" class="fixed inset-0 bg-black/50" @click="open = false"></div>

            <div x-show="open"
                 x-transition:enter="ease-out duration-300"
                 x-transition:enter-start="opacity-0 scale-95"
                 x-transition:enter-end="opacity-100 scale-100"
                 class="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 z-10">

                @if($title)
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">{{ $title }}</h3>
                    <button @click="open = false" class="text-gray-400 hover:text-gray-500">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    </button>
                </div>
                @endif

                {{ $slot }}
            </div>
        </div>
    </div>
</div>
