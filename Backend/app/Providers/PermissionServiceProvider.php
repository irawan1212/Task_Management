<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class PermissionServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register any Permission related bindings here
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Make sure Role model is bound properly for dependency injection
        $this->app->bind('role', function ($app) {
            return new Role();
        });

        $this->app->bind('permission', function ($app) {
            return new Permission();
        });
    }
}
