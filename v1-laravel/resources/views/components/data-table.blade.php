@props([
    'headers' => [],
    'empty' => 'No records found.',
])

<div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            @if(count($headers) > 0)
            <thead class="bg-gray-50">
                <tr>
                    @foreach($headers as $header)
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {{ $header }}
                    </th>
                    @endforeach
                </tr>
            </thead>
            @endif
            <tbody class="bg-white divide-y divide-gray-200">
                {{ $slot }}
            </tbody>
        </table>
    </div>

    @if(isset($pagination))
    <div class="px-6 py-3 border-t border-gray-200 bg-gray-50">
        {{ $pagination }}
    </div>
    @endif
</div>
