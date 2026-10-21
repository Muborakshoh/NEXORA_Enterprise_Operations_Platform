<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIAnomaly extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ai_anomalies';
    public $timestamps = false;

    protected $fillable = [
        'detector_id',
        'timestamp',
        'value',
        'expected_value',
        'deviation',
        'severity',
        'status',
        'context',
        'created_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:6',
            'expected_value' => 'decimal:6',
            'deviation' => 'decimal:6',
            'context' => 'array',
            'timestamp' => 'datetime',
            'created_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function detector()
    {
        return $this->belongsTo(AIAnomalyDetector::class, 'detector_id');
    }
}
