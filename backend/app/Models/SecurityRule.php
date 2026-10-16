<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SecurityRule extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'organization_id', 'name', 'description', 'type',
        'conditions', 'actions', 'priority', 'enabled',
    ];

    protected function casts(): array
    {
        return [
            'conditions' => 'array',
            'actions' => 'array',
            'priority' => 'integer',
            'enabled' => 'boolean',
        ];
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
