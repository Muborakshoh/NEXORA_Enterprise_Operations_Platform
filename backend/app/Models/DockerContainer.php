<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DockerContainer extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'organization_id',
        'server_id',
        'container_id',
        'name',
        'image',
        'status',
        'state',
        'ports',
        'started_at',
        'finished_at',
        'cpu_usage',
        'memory_usage',
        'memory_limit',
        'network_rx',
        'network_tx',
    ];

    protected function casts(): array
    {
        return [
            'ports' => 'array',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'cpu_usage' => 'decimal:2',
            'memory_usage' => 'decimal:2',
            'memory_limit' => 'decimal:2',
            'network_rx' => 'decimal:2',
            'network_tx' => 'decimal:2',
        ];
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function server()
    {
        return $this->belongsTo(Server::class);
    }

    public function infrastructureAlerts()
    {
        return $this->hasMany(InfrastructureAlert::class, 'resource_id')
            ->where('resource_type', 'container');
    }
}
