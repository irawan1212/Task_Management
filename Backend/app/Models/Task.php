<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Auditable as AuditableTrait;
use Ramsey\Uuid\Uuid;

class Task extends Model implements Auditable
{
    use HasFactory, SoftDeletes, AuditableTrait;

    protected $fillable = [
        'title',
        'description',
        'project_id',
        'category_id',
        'user_id',
        'assignee_id',
        'due_date',
        'is_completed',
        'status',
        'meta_data',
        'attachment', // Add this if you have attachment field
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'is_completed' => 'boolean',
        'meta_data' => 'json',
    ];

    // Add attributes to include in audit
    protected $auditInclude = [
        'title',
        'description',
        'project_id',
        'category_id',
        'user_id',
        'assignee_id',
        'due_date',
        'is_completed',
        'status',
        'meta_data',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->uuid = Uuid::uuid4()->toString();

            // Set default status if not provided
            if (empty($model->status)) {
                $model->status = $model->is_completed ? 'completed' : 'pending';
            }

            // Ensure consistency between user_id and assignee_id
            if ($model->assignee_id && !$model->user_id) {
                $model->user_id = $model->assignee_id;
            } elseif ($model->user_id && !$model->assignee_id) {
                $model->assignee_id = $model->user_id;
            }
        });

        static::updating(function ($model) {
            // Ensure consistency between status and is_completed
            if ($model->isDirty('status')) {
                $model->is_completed = $model->status === 'completed';
            } elseif ($model->isDirty('is_completed')) {
                $model->status = $model->is_completed ? 'completed' : 'pending';
            }

            // Ensure consistency between user_id and assignee_id
            if ($model->isDirty('assignee_id') && $model->assignee_id) {
                $model->user_id = $model->assignee_id;
            } elseif ($model->isDirty('user_id') && $model->user_id) {
                $model->assignee_id = $model->user_id;
            }
        });
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    // Add scope for filtering
    public function scopeCompleted($query)
    {
        return $query->where('is_completed', true);
    }

    public function scopePending($query)
    {
        return $query->where('is_completed', false);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // Add accessor for consistent assignee information
    public function getAssigneeNameAttribute()
    {
        return $this->assignee ? $this->assignee->name : ($this->user ? $this->user->name : null);
    }

    // Add mutator for meta_data to ensure it's always valid JSON
    public function setMetaDataAttribute($value)
    {
        if (is_string($value)) {
            try {
                $decoded = json_decode($value, true);
                $this->attributes['meta_data'] = json_encode($decoded);
            } catch (\Exception $e) {
                $this->attributes['meta_data'] = json_encode([]);
            }
        } else {
            $this->attributes['meta_data'] = json_encode($value ?? []);
        }
    }
}
