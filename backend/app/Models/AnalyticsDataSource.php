<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsDataSource extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'analytics_data_sources';

    protected $fillable = [
        'organization_id',
        'name',
        'type',
        'description',
        'schema',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'schema' => 'array',
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
}
