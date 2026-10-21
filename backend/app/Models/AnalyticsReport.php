<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsReport extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'analytics_reports';

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'type',
        'data_source',
        'query',
        'schedule',
        'format',
        'recipients',
        'created_by',
        'last_generated_at',
    ];

    protected function casts(): array
    {
        return [
            'query' => 'array',
            'schedule' => 'array',
            'format' => 'array',
            'recipients' => 'array',
            'last_generated_at' => 'datetime',
        ];
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function executions()
    {
        return $this->hasMany(AnalyticsReportExecution::class, 'report_id');
    }
}
