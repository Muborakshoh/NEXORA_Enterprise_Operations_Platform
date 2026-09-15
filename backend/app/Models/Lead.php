<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'customer_id',
        'title',
        'source',
        'status',
        'priority',
        'value',
        'currency',
        'contact_name',
        'contact_email',
        'contact_phone',
        'company',
        'expected_close_date',
        'description',
        'assigned_to',
        'created_by',
        'converted_at',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'expected_close_date' => 'date',
            'converted_at' => 'datetime',
        ];
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function deals()
    {
        return $this->hasMany(Deal::class);
    }

    public function timelineEntries()
    {
        return $this->hasMany(TimelineEntry::class);
    }
}
