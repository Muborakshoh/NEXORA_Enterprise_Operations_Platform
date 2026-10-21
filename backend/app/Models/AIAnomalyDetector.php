<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIAnomalyDetector extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ai_anomaly_detectors';

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'data_source',
        'metric',
        'algorithm',
        'config',
        'enabled',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'enabled' => 'boolean',
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

    public function anomalies()
    {
        return $this->hasMany(AIAnomaly::class, 'detector_id');
    }
}
