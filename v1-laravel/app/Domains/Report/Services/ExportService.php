<?php

namespace App\Domains\Report\Services;

use App\Domains\Order\Models\Order;
use App\Domains\Report\Services\SummaryService;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Barryvdh\DomPDF\Facade\Pdf;

class ExportService
{
    public function exportOrdersExcel(array $filters = []): string
    {
        $query = Order::with('fromStore', 'toStore', 'lines.item', 'creator');

        if (!empty($filters['status'])) $query->where('status', $filters['status']);
        if (!empty($filters['from_store_id'])) $query->where('from_store_id', $filters['from_store_id']);
        if (!empty($filters['to_store_id'])) $query->where('to_store_id', $filters['to_store_id']);
        if (!empty($filters['from_date'])) $query->whereDate('created_at', '>=', $filters['from_date']);
        if (!empty($filters['to_date'])) $query->whereDate('created_at', '<=', $filters['to_date']);

        $orders = $query->orderByDesc('created_at')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Orders');

        $headers = ['Order #', 'From', 'To', 'Status', 'Items', 'Total', 'Created', 'Completed'];
        foreach ($headers as $i => $header) {
            $sheet->setCellValue(chr(65 + $i) . '1', $header);
            $sheet->getStyle(chr(65 + $i) . '1')->getFont()->setBold(true);
        }

        $row = 2;
        foreach ($orders as $order) {
            $sheet->setCellValue("A{$row}", $order->order_number);
            $sheet->setCellValue("B{$row}", $order->fromStore->code);
            $sheet->setCellValue("C{$row}", $order->toStore->code);
            $sheet->setCellValue("D{$row}", ucfirst($order->status));
            $sheet->setCellValue("E{$row}", $order->lines->count());
            $sheet->setCellValue("F{$row}", $order->getTotalAmount());
            $sheet->setCellValue("G{$row}", $order->created_at->format('Y-m-d'));
            $sheet->setCellValue("H{$row}", $order->completed_at?->format('Y-m-d') ?? '-');
            $row++;
        }

        foreach (range('A', 'H') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $path = storage_path('app/exports/orders_' . now()->format('Ymd_His') . '.xlsx');
        @mkdir(dirname($path), 0755, true);
        $writer = new Xlsx($spreadsheet);
        $writer->save($path);

        return $path;
    }

    public function exportOrderPdf(Order $order): \Barryvdh\DomPDF\PDF
    {
        $order->load('fromStore', 'toStore', 'lines.item', 'creator');

        return Pdf::loadView('exports.order-pdf', compact('order'))
            ->setPaper('a4', 'portrait');
    }

    public function exportSummaryExcel(int $year, int $month, ?string $pair = null): string
    {
        $summaryService = app(SummaryService::class);
        $data = $summaryService->getMonthlySummary($year, $month, $pair);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle("Summary {$year}-{$month}");

        $headers = ['From', 'To', 'Orders', 'Total Amount'];
        foreach ($headers as $i => $header) {
            $sheet->setCellValue(chr(65 + $i) . '1', $header);
            $sheet->getStyle(chr(65 + $i) . '1')->getFont()->setBold(true);
        }

        $row = 2;
        foreach ($data['summary'] as $item) {
            $from = \App\Domains\User\Models\Store::find($item->from_store_id);
            $to = \App\Domains\User\Models\Store::find($item->to_store_id);
            $sheet->setCellValue("A{$row}", $from?->code ?? '-');
            $sheet->setCellValue("B{$row}", $to?->code ?? '-');
            $sheet->setCellValue("C{$row}", $item->total_orders);
            $sheet->setCellValue("D{$row}", $item->total_amount);
            $row++;
        }

        $sheet->setCellValue("C{$row}", 'Grand Total:');
        $sheet->setCellValue("D{$row}", $data['grand_total']);
        $sheet->getStyle("C{$row}:D{$row}")->getFont()->setBold(true);

        foreach (range('A', 'D') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $path = storage_path('app/exports/summary_' . $year . '_' . $month . '.xlsx');
        @mkdir(dirname($path), 0755, true);
        $writer = new Xlsx($spreadsheet);
        $writer->save($path);

        return $path;
    }
}
