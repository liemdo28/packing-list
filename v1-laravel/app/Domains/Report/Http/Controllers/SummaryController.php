<?php

namespace App\Domains\Report\Http\Controllers;

use App\Domains\User\Models\Store;
use App\Domains\Report\Services\SummaryService;
use App\Domains\Report\Services\ExportService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SummaryController extends Controller
{
    public function __construct(
        protected SummaryService $summaryService,
        protected ExportService $exportService
    ) {}

    public function index(Request $request)
    {
        $year = (int) $request->input('year', now()->year);
        $month = (int) $request->input('month', now()->month);
        $pair = $request->input('pair', 'B1-B2');
        $view = $request->input('view', 'overview');

        $stores = Store::active()->get();
        $pairs = ['B1-B2', 'B1-B3', 'B2-B3'];

        // Always compute overview
        $overview = $this->summaryService->getOverview($year, $month);

        // Pair data (item-level monthly summary for selected pair)
        $pairData = [];
        if (in_array($pair, $pairs)) {
            $pairData = $this->summaryService->getMonthlySummary($year, $month, $pair);
        }

        // Yearly statistics
        $yearlyData = [];
        if ($view === 'yearly') {
            $yearlyData = $this->summaryService->getYearlyStats($year, $pair);
        }

        return Inertia::render('Summary/Index', [
            'overview' => $overview,
            'pairData' => $pairData,
            'yearlyData' => $yearlyData,
            'year' => $year,
            'month' => $month,
            'pair' => $pair,
            'view' => $view,
            'pairs' => $pairs,
            'stores' => $stores,
        ]);
    }

    /**
     * Return JSON drill-down data for a specific pair's individual orders.
     */
    public function pairDetail(Request $request)
    {
        $year = (int) $request->input('year', now()->year);
        $month = (int) $request->input('month', now()->month);
        $pair = $request->input('pair', 'B1-B2');

        [$fromCode, $toCode] = explode('-', $pair);
        $fromStore = Store::where('code', $fromCode)->first();
        $toStore = Store::where('code', $toCode)->first();

        if (!$fromStore || !$toStore) {
            return response()->json([]);
        }

        $data = $this->summaryService->getPairDetail($year, $month, $fromStore->id, $toStore->id);

        return response()->json($data);
    }

    public function exportExcel(Request $request)
    {
        $year = (int) $request->input('year', now()->year);
        $month = (int) $request->input('month', now()->month);
        $pair = $request->input('pair');
        $type = $request->input('type', 'monthly'); // monthly or yearly

        $path = $this->exportService->exportSummaryExcel($year, $month, $pair, $type);
        return response()->download($path)->deleteFileAfterSend();
    }
}
