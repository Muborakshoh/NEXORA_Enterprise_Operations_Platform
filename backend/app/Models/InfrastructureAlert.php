<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InfrastructureAlert extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'organization_id',
        'type',
        'severity',
        'title',
        'description',
        'resource_type',
        'resource_id',
        'resource_name',
        'metric_name',
        'metric_value',
        'threshold',
        'status',
        'acknowledged',
        'acknowledged_by',
        'acknowledged_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'metric_value' => 'decimal:2',
            'threshold' => 'decimal:2',
            'acknowledged' => 'boolean',
            'acknowledged_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function acknowledgedByUser()
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }

    public function resource()
    {
        return match ($this->resource_type) {
            'server' => $this->belongsTo(Server::class, 'resource_id'),
            'service' => $this->belongsTo(Service::class, 'resource_id'),
            'container' => $this->belongsTo(DockerContainer::class, 'resource_id'),
            default => null,
        };
    }
}
