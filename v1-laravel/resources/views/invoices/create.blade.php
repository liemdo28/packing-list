@extends('layouts.app')
@section('title', 'Create Invoice')

@section('content')
<div class="max-w-4xl mx-auto">
    <div class="mb-6">
        <a href="{{ route('invoices.index') }}" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Invoices</a>
        <h2 class="text-2xl font-bold text-gray-900 mt-2">Create Invoice</h2>
    </div>

    <form method="POST" action="{{ route('invoices.store') }}" x-data="invoiceForm()">
        @csrf
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label for="supplier" class="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <input type="text" name="supplier" id="supplier" value="{{ old('supplier', config('packinglist.default_supplier')) }}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label for="invoice_number" class="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                    <input type="text" name="invoice_number" id="invoice_number" value="{{ old('invoice_number') }}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label for="invoice_date" class="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                    <input type="date" name="invoice_date" id="invoice_date" value="{{ old('invoice_date', date('Y-m-d')) }}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label for="store_id" class="block text-sm font-medium text-gray-700 mb-1">Store</label>
                    <select name="store_id" id="store_id" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Store</option>
                        @foreach($stores as $store)
                        <option value="{{ $store->id }}" {{ old('store_id') == $store->id ? 'selected' : '' }}>{{ $store->name }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="mt-4">
                <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" id="notes" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{{ old('notes') }}</textarea>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Invoice Lines</h3>
                <button type="button" @click="addLine()" class="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700">+ Add Line</button>
            </div>

            <template x-for="(line, index) in lines" :key="index">
                <div class="border border-gray-200 rounded-lg p-4 mb-3">
                    <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div class="sm:col-span-4">
                            <label class="block text-xs font-medium text-gray-500 mb-1">Description</label>
                            <input type="text" :name="`lines[${index}][description]`" x-model="line.description" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        </div>
                        <div class="sm:col-span-3">
                            <label class="block text-xs font-medium text-gray-500 mb-1">Item (optional)</label>
                            <select :name="`lines[${index}][item_id]`" x-model="line.item_id" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                <option value="">None</option>
                                @foreach($items as $item)
                                <option value="{{ $item->id }}">{{ $item->code }} - {{ $item->name }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                            <input type="number" :name="`lines[${index}][qty]`" x-model="line.qty" step="0.01" min="0.01" required @input="updateTotal(index)"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-medium text-gray-500 mb-1">Unit Price</label>
                            <input type="number" :name="`lines[${index}][unit_price]`" x-model="line.unit_price" step="0.01" min="0" required @input="updateTotal(index)"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        </div>
                        <div class="sm:col-span-1 flex justify-center">
                            <button type="button" @click="removeLine(index)" x-show="lines.length > 1" class="text-red-500 hover:text-red-700 p-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="mt-1 text-right text-sm text-gray-500">Line Total: <span class="font-medium" x-text="formatPrice(line.total)"></span></div>
                </div>
            </template>

            <div class="mt-4 flex justify-end">
                <span class="text-sm text-gray-500">Grand Total: </span>
                <span class="text-lg font-bold text-gray-900 ml-2" x-text="formatPrice(grandTotal())"></span>
            </div>
        </div>

        <div class="flex justify-end gap-3">
            <a href="{{ route('invoices.index') }}" class="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</a>
            <button type="submit" class="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Invoice</button>
        </div>
    </form>
</div>

<script>
function invoiceForm() {
    return {
        lines: [{ description: '', item_id: '', qty: 1, unit_price: 0, total: 0 }],
        addLine() { this.lines.push({ description: '', item_id: '', qty: 1, unit_price: 0, total: 0 }); },
        removeLine(i) { this.lines.splice(i, 1); },
        updateTotal(i) { this.lines[i].total = (this.lines[i].qty || 0) * (this.lines[i].unit_price || 0); },
        grandTotal() { return this.lines.reduce((s, l) => s + (l.total || 0), 0); },
        formatPrice(v) { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(v || 0); }
    };
}
</script>
@endsection
