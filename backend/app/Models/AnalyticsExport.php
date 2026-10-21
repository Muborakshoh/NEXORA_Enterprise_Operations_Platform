<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsExport extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'analytics_exports';

    protected $fillable = [
        'organization_id',
        'name',
        'type',
        'format',
        'status',
        'data_source',
        'filters',
        'columns',
        'created_by',
        'completed_at',
        'download_url',
        'file_size',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'filters' => 'array',
            'columns' => 'array',
            'completed_at' => 'datetime',
            'expires_at' => 'datetime',
            'file_size' => 'integer',
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
