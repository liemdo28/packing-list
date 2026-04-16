<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

class AuditObserver
{
    public function created(Model $model): void
    {
        $this->log('create', $model, null, $model->getAttributes());
    }

    public function updated(Model $model): void
    {
        $this->log('update', $model, $model->getOriginal(), $model->getChanges());
    }

    public function deleted(Model $model): void
    {
        $this->log('delete', $model, $model->getAttributes(), null);
    }

    protected function log(string $action, Model $model, ?array $old, ?array $new): void
    {
        if ($model instanceof AuditLog) return;

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'table_name' => $model->getTable(),
            'record_id' => $model->getKey(),
            'old_values' => $old,
            'new_values' => $new,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }
}
