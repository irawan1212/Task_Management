<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\Exceptions\UnauthorizedException;

class SafeRoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string|null  $role
     * @return mixed
     */
    public function handle(Request $request, Closure $next, $role)
    {
        // If user is not authenticated, throw unauthorized exception
        if (!$request->user()) {
            throw UnauthorizedException::notLoggedIn();
        }

        // Check if the Spatie tables exist (set by CheckSpatiePermissionMiddleware)
        $spatieTablesExist = $request->attributes->get('spatie_tables_exist', false);

        // Convert pipe-separated roles to array
        $roles = is_array($role) ? $role : explode('|', $role);

        // If the spatie tables exist, use the standard role check
        if ($spatieTablesExist) {
            if (!$request->user()->hasAnyRole($roles)) {
                throw UnauthorizedException::forRoles($roles);
            }
        } else {
            // Fallback to a simple role check using the 'role' attribute on the user model
            $userRole = $request->user()->role ?? null;

            // Check if the user's role is in the required roles
            if (!in_array($userRole, $roles)) {
                throw UnauthorizedException::forRoles($roles);
            }
        }

        return $next($request);
    }
}
