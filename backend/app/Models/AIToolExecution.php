<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIToolExecution extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ai_tool_executions';
    public $timestamps = false;

    protected $fillable = [
        'tool_id',
        'tool_name',
        'arguments',
        'result',
        'error',
        'execution_time_ms',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'arguments' => 'array',
            'result' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function tool()
    {
        return $this->belongsTo(AITool::class, 'tool_id');
    }
}
