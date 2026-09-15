<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Service extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'server_id',
        'name',
        'type',
        'status',
        'port',
        'version',
        'description',
        'health_check_url',
        'last_checked_at',
    ];

    protected function casts(): array
    {
        return [
            'port' => 'integer',
            'last_checked_at' => 'datetime',
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
            ->where('resource_type', 'service');
    }
}
