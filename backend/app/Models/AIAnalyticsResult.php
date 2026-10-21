<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIAnalyticsResult extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ai_analytics_results';
    public $timestamps = false;

    protected $fillable = [
        'analytics_id',
        'status',
        'result',
        'error',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'result' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function analytics()
    {
        return $this->belongsTo(AIAnalytics::class, 'analytics_id');
    }
}
