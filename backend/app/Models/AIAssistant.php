<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIAssistant extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ai_assistants';

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'model',
        'capabilities',
        'config',
        'api_key',
        'provider',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'capabilities' => 'array',
            'config' => 'array',
            'is_active' => 'boolean',
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

    public function conversations()
    {
        return $this->hasMany(AIConversation::class, 'assistant_id');
    }
}
