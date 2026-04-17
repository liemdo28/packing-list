<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Domains\Audit\Models\AuditLog;

class AuditMiddleware
{
    /**
     * Log significant write operations (POST, PUT, PATCH, DELETE) to the audit log.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE']) && auth()->check()) {
            try {
                $routeName = $request->route()?->getName() ?? 'unknown';
                $action = $this->resolveAction($request->method(), $routeName);

                AuditLog::create([
                    'user_id' => auth()->id(),
                    'action' => $action,
                    'table_name' => $this->resolveTableName($routeName),
                    'record_id' => $request->route()?->parameter('order')?->id
                        ?? $request->route()?->parameter('item')?->id
                        ?? $request->route()?->parameter('store')?->id
                        ?? $request->route()?->parameter('user')?->id
                        ?? $request->route()?->parameter('invoice')?->id
                        ?? null,
                    'old_values' => null,
                    'new_values' => $this->sanitizeInput($request->except(['_token', '_method', 'password', 'password_confirmation'])),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            } catch (\Exception $e) {
                logger()->error('AuditMiddleware failed: ' . $e->getMessage());
            }
        }

        return $response;
    }

    protected function resolveAction(string $method, string $routeName): string
    {
        if (str_contains($routeName, 'store') || $method === 'POST') {
            return 'create';
        }
        if (str_contains($routeName, 'update') || in_array($method, ['PUT', 'PATCH'])) {
            return 'update';
        }
        if (str_contains($routeName, 'destroy') || $method === 'DELETE') {
            return 'delete';
        }

        return strtolower($method);
    }

    protected function resolveTableName(string $routeName): string
    {
        $parts = explode('.', $routeName);
        return $parts[0] ?? 'unknown';
    }

    protected function sanitizeInput(array $input): array
    {
        $sensitive = ['password', 'password_confirmation', 'token', 'secret'];
        foreach ($sensitive as $key) {
            if (isset($input[$key])) {
                $input[$key] = '***REDACTED***';
            }
        }
        return $input;
    }
}
