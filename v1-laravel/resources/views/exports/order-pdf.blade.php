<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order {{ $order->order_number }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 20px; }
        .header p { margin: 5px 0 0; color: #666; }
        .info-grid { display: table; width: 100%; margin-bottom: 20px; }
        .info-col { display: table-cell; width: 50%; vertical-align: top; }
        .info-col p { margin: 3px 0; }
        .label { color: #666; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; font-size: 11px; text-transform: uppercase; }
        .text-right { text-align: right; }
        .total-row { background: #f5f5f5; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TRANSFER ORDER</h1>
        <p>Order Number: {{ $order->order_number }}</p>
    </div>

    <div class="info-grid">
        <div class="info-col">
            <p><span class="label">From:</span> <strong>{{ $order->fromStore->name }}</strong></p>
            <p><span class="label">To:</span> <strong>{{ $order->toStore->name }}</strong></p>
            <p><span class="label">Status:</span> {{ ucfirst($order->status) }}</p>
        </div>
        <div class="info-col">
            <p><span class="label">Created:</span> {{ $order->created_at->format('d M Y H:i') }}</p>
            <p><span class="label">Created By:</span> {{ $order->creator->name ?? '-' }}</p>
            @if($order->completed_at)
            <p><span class="label">Completed:</span> {{ $order->completed_at->format('d M Y H:i') }}</p>
            @endif
        </div>
    </div>

    @if($order->notes)
    <p><span class="label">Notes:</span> {{ $order->notes }}</p>
    @endif

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Code</th>
                <th>Item</th>
                <th>Unit</th>
                <th class="text-right">Req. Qty</th>
                <th class="text-right">Shipped</th>
                <th class="text-right">Received</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->lines as $i => $line)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $line->item->code ?? '-' }}</td>
                <td>{{ $line->item->name ?? '-' }}</td>
                <td>{{ $line->item->unit ?? '-' }}</td>
                <td class="text-right">{{ number_format($line->requested_qty, 2) }}</td>
                <td class="text-right">{{ $line->shipped_qty !== null ? number_format($line->shipped_qty, 2) : '-' }}</td>
                <td class="text-right">{{ $line->received_qty !== null ? number_format($line->received_qty, 2) : '-' }}</td>
                <td class="text-right">{{ number_format($line->unit_price, 2) }}</td>
                <td class="text-right">{{ number_format($line->line_total, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="8" class="text-right">Grand Total</td>
                <td class="text-right">{{ number_format($order->totalAmount(), 2) }}</td>
            </tr>
        </tfoot>
    </table>

    <div class="footer">
        <p>Generated on {{ now()->format('d M Y H:i:s') }} | Restaurant Operation System</p>
    </div>
</body>
</html>
