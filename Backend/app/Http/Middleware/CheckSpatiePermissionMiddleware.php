<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class CheckSpatiePermissionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Skip middleware if running tests
        if (app()->environment('testing')) {
            return $next($request);
        }

        // Check if the package tables exist
        $hasRolesTable = Schema::hasTable('roles');
        $hasPermissionsTable = Schema::hasTable('permissions');
        $hasModelHasRolesTable = Schema::hasTable('model_has_roles');

        // Store information in the request for controllers to use
        $request->attributes->add([
            'spatie_tables_exist' => $hasRolesTable && $hasPermissionsTable && $hasModelHasRolesTable,
        ]);

        Log::info('Spatie tables check: ' . ($request->attributes->get('spatie_tables_exist') ? 'Exists' : 'Missing'));

        return $next($request);
    }
    
}
