<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIMessage extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ai_messages';
    public $timestamps = false;

    protected $fillable = [
        'conversation_id',
        'role',
        'content',
        'tool_calls',
        'tool_results',
        'metadata',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'tool_calls' => 'array',
            'tool_results' => 'array',
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function conversation()
    {
        return $this->belongsTo(AIConversation::class, 'conversation_id');
    }
}
