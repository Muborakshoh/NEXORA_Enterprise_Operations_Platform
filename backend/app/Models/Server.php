<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Server extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'name',
        'hostname',
        'ip_address',
        'os',
        'os_version',
        'status',
        'provider',
        'region',
        'specs',
        'tags',
        'metadata',
        'last_checked_at',
    ];

    protected function casts(): array
    {
        return [
            'specs' => 'array',
            'tags' => 'array',
            'metadata' => 'array',
            'last_checked_at' => 'datetime',
        ];
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function dockerContainers()
    {
        return $this->hasMany(DockerContainer::class);
    }

    public function infrastructureAlerts()
    {
        return $this->hasMany(InfrastructureAlert::class, 'resource_id')
            ->where('resource_type', 'server');
    }
}
