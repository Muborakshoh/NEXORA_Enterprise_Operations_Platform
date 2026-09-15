<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuspiciousActivity extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'organization_id',
        'type',
        'confidence',
        'title',
        'description',
        'user_id',
        'ip_address',
        'indicators',
        'status',
        'reviewed',
        'reviewed_by',
        'reviewed_at',
        'resolution',
    ];

    protected function casts(): array
    {
        return [
            'confidence' => 'integer',
            'indicators' => 'array',
            'reviewed' => 'boolean',
            'reviewed_at' => 'datetime',
        ];
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewedByUser()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
