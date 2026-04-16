@extends('layouts.app')
@section('title', 'Edit Order')

@section('content')
<div class="max-w-4xl mx-auto">
    <div class="mb-6">
        <a href="{{ route('orders.show', $order) }}" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Order</a>
        <h2 class="text-2xl font-bold text-gray-900 mt-2">Edit Order: {{ $order->order_number }}</h2>
        <p class="text-gray-500">From: {{ $fromStore->name }} ({{ $fromStore->code }})</p>
    </div>

    <form method="POST" action="{{ route('orders.update', $order) }}" x-data="orderForm()">
        @csrf @method('PUT')
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">From Store</label>
                    <input type="text" value="{{ $fromStore->name }}" disabled class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500">
                </div>
                <div>
                    <label for="to_store_id" class="block text-sm font-medium text-gray-700 mb-1">To Store</label>
                    <select name="to_store_id" id="to_store_id" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        @foreach($destinations as $dest)
                        <option value="{{ $dest->id }}" {{ old('to_store_id', $order->to_store_id) == $dest->id ? 'selected' : '' }}>{{ $dest->name }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="mt-4">
                <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" id="notes" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">{{ old('notes', $order->notes) }}</textarea>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Order Lines</h3>
                <button type="button" @click="addLine()" class="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700">+ Add Line</button>
            </div>

            <template x-for="(line, index) in lines" :key="index">
                <div class="border border-gray-200 rounded-lg p-4 mb-3">
                    <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div class="sm:col-span-5">
                            <label class="block text-xs font-medium text-gray-500 mb-1">Item</label>
                            <select :name="`lines[${index}][item_id]`" x-model="line.item_id" required @change="updatePrice(index)"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                <option value="">Select Item</option>
                                @foreach($items as $item)
                                <option value="{{ $item->id }}">{{ $item->code }} - {{ $item->name }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                            <input type="number" :name="`lines[${index}][requested_qty]`" x-model="line.requested_qty" step="0.01" min="0.01" required @input="updateTotal(index)"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-medium text-gray-500 mb-1">Price</label>
                            <input type="text" :value="formatPrice(line.price)" disabled class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-500">
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-medium text-gray-500 mb-1">Total</label>
                            <input type="text" :value="formatPrice(line.total)" disabled class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-500">
                        </div>
                        <div class="sm:col-span-1 flex justify-center">
                            <button type="button" @click="removeLine(index)" x-show="lines.length > 1" class="text-red-500 hover:text-red-700 p-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="mt-2">
                        <input type="text" :name="`lines[${index}][notes]`" x-model="line.notes" placeholder="Line notes (optional)"
                               class="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
                    </div>
                </div>
            </template>

            <div class="mt-4 flex justify-end">
                <div class="text-right">
                    <span class="text-sm text-gray-500">Grand Total: </span>
                    <span class="text-lg font-bold text-gray-900" x-text="formatPrice(grandTotal())"></span>
                </div>
            </div>
        </div>

        <div class="flex flex-col sm:flex-row justify-end gap-3">
            <a href="{{ route('orders.show', $order) }}" class="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 text-center">Cancel</a>
            <button type="submit" class="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Update Order</button>
        </div>
    </form>
</div>

<script>
function orderForm() {
    const itemPrices = {
        @foreach($items as $item)
        '{{ $item->id }}': {{ $item->getCurrentPriceValue() }},
        @endforeach
    };

    const existingLines = @json($order->lines->map(fn($l) => [
        'item_id' => (string) $l->item_id,
        'requested_qty' => $l->requested_qty,
        'notes' => $l->notes ?? '',
        'price' => $l->unit_price,
        'total' => $l->line_total,
    ]));

    return {
        lines: existingLines.length ? existingLines : [{ item_id: '', requested_qty: 1, notes: '', price: 0, total: 0 }],
        addLine() { this.lines.push({ item_id: '', requested_qty: 1, notes: '', price: 0, total: 0 }); },
        removeLine(index) { this.lines.splice(index, 1); },
        updatePrice(index) {
            this.lines[index].price = itemPrices[this.lines[index].item_id] || 0;
            this.updateTotal(index);
        },
        updateTotal(index) { this.lines[index].total = (this.lines[index].requested_qty || 0) * (this.lines[index].price || 0); },
        grandTotal() { return this.lines.reduce((s, l) => s + (l.total || 0), 0); },
        formatPrice(v) { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(v || 0); }
    };
}
</script>
@endsection
