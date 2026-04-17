<?php

namespace App\Domains\Audit\Http\Controllers;

use App\Domains\Audit\Models\AuditLog;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user')->orderByDesc('created_at');

        if ($request->filled('table')) {
            $query->where('table_name', $request->table);
        }
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $logs = $query->paginate(30)->withQueryString();
        $tables = AuditLog::distinct('table_name')->pluck('table_name');

        return Inertia::render('AuditLogs/Index', compact('logs', 'tables'));
    }
}
