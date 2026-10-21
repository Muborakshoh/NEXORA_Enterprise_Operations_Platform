<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsReportExecution extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'analytics_report_executions';

    protected $fillable = [
        'report_id',
        'status',
        'started_at',
        'completed_at',
        'error',
        'result_url',
        'format',
        'file_size',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'file_size' => 'integer',
        ];
    }

    public function report()
    {
        return $this->belongsTo(AnalyticsReport::class, 'report_id');
    }
}
