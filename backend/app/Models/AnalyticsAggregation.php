<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsAggregation extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'analytics_aggregations';

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'data_source',
        'metric',
        'aggregation_type',
        'dimensions',
        'filters',
        'time_granularity',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'dimensions' => 'array',
            'filters' => 'array',
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
}
