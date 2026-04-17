<?php

namespace App\Domains\Report\Http\Controllers;

use App\Domains\Order\Models\Order;
use App\Domains\Report\Services\ExportService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    public function __construct(protected ExportService $exportService) {}

    public function ordersExcel(Request $request)
    {
        $path = $this->exportService->exportOrdersExcel($request->all());
        return response()->download($path)->deleteFileAfterSend();
    }

    public function orderPdf(Order $order)
    {
        $pdf = $this->exportService->exportOrderPdf($order);
        return $pdf->download("order-{$order->order_number}.pdf");
    }
}
