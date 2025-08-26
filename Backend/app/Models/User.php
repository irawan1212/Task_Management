<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Traits\HasRoles;

/**
 * @method \Laravel\Sanctum\NewAccessToken createToken(string $name, array $abilities = ['*'])
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    // Only include the trait if it exists
    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);

        if (!trait_exists('Spatie\Permission\Traits\HasRoles')) {
            Log::warning('Spatie Permission package not found.');
        }
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Get the projects managed by this user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function projects()
    {
        return $this->hasMany(Project::class, 'manager_id');
    }

    /**
     * Get the tasks assigned to this user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function tasks()
    {
        return $this->hasMany(Task::class, 'assignee_id');
    }

    /**
     * Safe wrapper for role methods in case Spatie package isn't available
     */
    public function getRoleNames()
    {
        try {
            if (trait_exists('Spatie\Permission\Traits\HasRoles') && method_exists($this, 'roles')) {
                return $this->roles()->pluck('name');
            }
            return collect([]);
        } catch (\Exception $e) {
            Log::warning('Failed to get role names: ' . $e->getMessage());
            return collect([]);
        }
    }

    /**
     * Define a fallback roles relation if HasRoles trait is not available
     */
    public function roles()
    {
        try {
            if (trait_exists('Spatie\Permission\Traits\HasRoles') && method_exists(parent::class, 'roles')) {
                return parent::roles();
            }

            // Fallback manual definition if the DB tables exist
            return $this->belongsToMany(
                config('permission.models.role', 'App\Models\Role'),
                config('permission.table_names.model_has_roles', 'model_has_roles'),
                'model_id',
                'role_id'
            )->where('model_type', $this->getMorphClass());
        } catch (\Exception $e) {
            Log::warning('Error accessing roles relation: ' . $e->getMessage());
            return $this->belongsToMany(
                'App\Models\Role',
                'model_has_roles',
                'model_id',
                'role_id'
            )->where('model_type', $this->getMorphClass());
        }
    }
}
