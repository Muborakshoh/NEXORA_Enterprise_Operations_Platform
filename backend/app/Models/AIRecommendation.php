<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIRecommendation extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ai_recommendations';

    protected $fillable = [
        'organization_id',
        'type',
        'category',
        'title',
        'description',
        'impact',
        'confidence',
        'source',
        'action_url',
        'metadata',
        'status',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'confidence' => 'decimal:4',
            'metadata' => 'array',
            'expires_at' => 'datetime',
        ];
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
