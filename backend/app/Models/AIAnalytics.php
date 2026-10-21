<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIAnalytics extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ai_analytics';

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'type',
        'data_source',
        'query',
        'schedule',
        'created_by',
        'last_run_at',
    ];

    protected function casts(): array
    {
        return [
            'query' => 'array',
            'schedule' => 'array',
            'last_run_at' => 'datetime',
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

    public function results()
    {
        return $this->hasMany(AIAnalyticsResult::class, 'analytics_id');
    }
}
