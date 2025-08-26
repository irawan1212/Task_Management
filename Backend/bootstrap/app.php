<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\Cors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Register CORS middleware for API routes
        $middleware->api(prepend: [
            Cors::class,
        ]);

        // Register global middleware
        $middleware->append(\App\Http\Middleware\CheckSpatiePermissionMiddleware::class);

        // Alias for route middleware
        $middleware->alias([
            'cors' => Cors::class,
            'safe.role' => \App\Http\Middleware\SafeRoleMiddleware::class,
            'safe.permission' => \App\Http\Middleware\SafePermissionMiddleware::class,
            'safe.role_or_permission' => \App\Http\Middleware\SafeRoleOrPermissionMiddleware::class,
            'role' => \Spatie\Permission\Middlewares\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middlewares\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middlewares\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
