<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AITool extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ai_tools';

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'category',
        'parameters',
        'return_type',
        'enabled',
    ];

    protected function casts(): array
    {
        return [
            'parameters' => 'array',
            'enabled' => 'boolean',
        ];
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function executions()
    {
        return $this->hasMany(AIToolExecution::class, 'tool_id');
    }
}
