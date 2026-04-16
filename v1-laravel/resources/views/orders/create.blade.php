@extends('layouts.app')
@section('title', 'Create Order')
@section('content')
<div class="card" x-data="orderForm()">
    <form method="POST" action="{{ route('orders.store') }}">
        @csrf
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <label class="label">From Store</label>
                <input type="text" value="{{ $fromStore->code }} - {{ $fromStore->name }}" class="input-field bg-gray-50" disabled>
            </div>
            <div>
                <label class="label">To Store *</label>
                <select name="to_store_id" required class="input-field">
                    <option value="">Select destination...</option>
                    @foreach($destinationStores as $store)
                    <option value="{{ $store->id }}">{{ $store->code }} - {{ $store->name }}</option>
                    @endforeach
                </select>
            </div>
        </div>
        <div>
            <label class="label">Notes</label>
            <textarea name="notes" rows="2" class="input-field" placeholder="Optional notes...">{{ old('notes') }}</textarea>
        </div>
        <div class="mt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
            <template x-for="(line, index) in lines" :key="index">
                <div class="flex gap-4 items-end mb-3">
                    <div class="flex-1">
                        <label x-show="index===0" class="label">Item *</label>
                        <select :name="'lines['+index+'][item_id]'" required class="input-field" x-model="line.item_id">
                            <option value="">Select item...</option>
                            @foreach($items as $item)
                            <option value="{{ $item->id }}">{{ $item->code }} - {{ $item->name }} ({{ $item->unit }})</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="w-32">
                        <label x-show="index===0" class="label">Qty *</label>
                        <input type="number" :name="'lines['+index+'][requested_qty]'" step="0.01" min="0.01" required class="input-field" x-model="line.requested_qty">
                    </div>
                    <button type="button" @click="removeLine(index)" class="btn-danger mb-0.5" x-show="lines.length > 1">&times;</button>
                </div>
            </template>
            <button type="button" @click="addLine()" class="btn-secondary mt-2">+ Add Item</button>
        </div>
        <div class="mt-6 flex justify-end gap-3">
            <a href="{{ route('orders.index') }}" class="btn-secondary">Cancel</a>
            <button type="submit" class="btn-primary">Create Order (Draft)</button>
        </div>
    </form>
</div>

<script>
function orderForm() {
    return {
        lines: [{ item_id: '', requested_qty: '' }],
        addLine() { this.lines.push({ item_id: '', requested_qty: '' }); },
        removeLine(i) { this.lines.splice(i, 1); }
    }
}
</script>
@endsection
