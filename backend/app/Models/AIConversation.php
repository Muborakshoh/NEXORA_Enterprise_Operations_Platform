<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIConversation extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ai_conversations';

    protected $fillable = [
        'assistant_id',
        'user_id',
        'title',
        'context',
    ];

    protected function casts(): array
    {
        return [
            'context' => 'array',
        ];
    }

    public function assistant()
    {
        return $this->belongsTo(AIAssistant::class, 'assistant_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function messages()
    {
        return $this->hasMany(AIMessage::class, 'conversation_id');
    }
}
