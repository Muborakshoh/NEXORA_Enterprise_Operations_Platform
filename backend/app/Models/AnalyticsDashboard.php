<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsDashboard extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'widgets',
        'layout',
        'is_default',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'widgets' => 'array',
            'layout' => 'array',
            'is_default' => 'boolean',
        ];
    }
}
