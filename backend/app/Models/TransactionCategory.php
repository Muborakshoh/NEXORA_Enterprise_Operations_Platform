<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransactionCategory extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'organization_id',
        'name',
        'type',
        'color',
        'icon',
        'parent_id',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function parent()
    {
        return $this->belongsTo(TransactionCategory::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(TransactionCategory::class, 'parent_id');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'category_id');
    }
}
