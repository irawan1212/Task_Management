<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Builder;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // This removes any global scope macros that might be causing issues
        // Only add this if you've determined your app doesn't rely on the scope elsewhere
        /*
        if (Builder::hasGlobalMacro('role')) {
            Builder::macro('role', function ($roles) {
                $this->whereHas('roles', function ($q) use ($roles) {
                    $roles = is_array($roles) ? $roles : [$roles];
                    $q->whereIn('name', $roles);
                });
                return $this;
            });
        }
        */
    }
}
