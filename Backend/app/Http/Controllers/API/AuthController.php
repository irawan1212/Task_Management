<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;


class AuthController extends Controller
{
    /**
     * Map Spatie permissions to frontend format
     */
    private function mapPermissionsToFrontend($user, $role)
    {
        // Default permissions
        $frontendPermissions = [
            'create' => false,
            'read' => false,
            'update' => false,
            'delete' => false,
            'read_task' => false,
            'create_task' => false,
            'update_task' => false,
            'delete_task' => false,
        ];

        // Log for debugging
        Log::info('Mapping permissions for user: ' . $user->email, [
            'user_id' => $user->id,
            'role' => $role ? $role->name : 'No role found'
        ]);

        // If user is Administrator, grant all permissions
        if ($role && $role->name === 'Administrator') {
            Log::info('User is Administrator, granting all permissions');
            return [
                'create' => true,
                'read' => true,
                'update' => true,
                'delete' => true,
                'read_task' => true,
                'create_task' => true,
                'update_task' => true,
                'delete_task' => true,
            ];
        }

        // Try to get user permissions using Spatie if available
        try {
            // Check if Spatie permissions are available and working
            if (trait_exists('Spatie\Permission\Traits\HasRoles') && method_exists($user, 'hasPermissionTo')) {
                Log::info('Using Spatie permission system');

                // Force refresh user permissions from database
                $user->load('roles.permissions');

                $frontendPermissions['read'] = $user->hasPermissionTo('view projects');
                $frontendPermissions['create'] = $user->hasPermissionTo('create projects');
                $frontendPermissions['update'] = $user->hasPermissionTo('edit projects');
                $frontendPermissions['delete'] = $user->hasPermissionTo('delete projects');
                $frontendPermissions['read_task'] = $user->hasPermissionTo('view tasks');
                $frontendPermissions['create_task'] = $user->hasPermissionTo('create tasks');
                $frontendPermissions['update_task'] = $user->hasPermissionTo('edit tasks');
                $frontendPermissions['delete_task'] = $user->hasPermissionTo('delete tasks');

                Log::info('Spatie permissions mapped', $frontendPermissions);
            } else {
                Log::info('Spatie not available, using fallback permission check');

                // Fallback: check permissions directly from role data
                if ($role && isset($role->permissions)) {
                    $rolePermissions = is_string($role->permissions) ? json_decode($role->permissions, true) : $role->permissions;
                    $rolePermissions = $rolePermissions ?: [];

                    Log::info('Role permissions found', ['permissions' => $rolePermissions]);

                    $frontendPermissions['read'] = in_array('view projects', $rolePermissions);
                    $frontendPermissions['create'] = in_array('create projects', $rolePermissions);
                    $frontendPermissions['update'] = in_array('edit projects', $rolePermissions);
                    $frontendPermissions['delete'] = in_array('delete projects', $rolePermissions);
                    $frontendPermissions['read_task'] = in_array('view tasks', $rolePermissions);
                    $frontendPermissions['create_task'] = in_array('create tasks', $rolePermissions);
                    $frontendPermissions['update_task'] = in_array('edit tasks', $rolePermissions);
                    $frontendPermissions['delete_task'] = in_array('delete tasks', $rolePermissions);
                } else {
                    Log::warning('No role or permissions found for user');
                }
            }
        } catch (\Exception $e) {
            Log::error('Permission mapping failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString()
            ]);
        }

        Log::info('Final permissions for user', $frontendPermissions);
        return $frontendPermissions;
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
        ]);

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            $userRole = DB::table('roles')->where('name', 'User')->first();
            if ($userRole) {
                DB::table('model_has_roles')->insert([
                    'role_id' => $userRole->id,
                    'model_type' => User::class,
                    'model_id' => $user->id
                ]);
            }

            $token = $user->createToken('api-token')->plainTextToken;

            // Map permissions to frontend format
            $permissions = $this->mapPermissionsToFrontend($user, $userRole);

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => 'User',
                    'permissions' => $permissions,
                ],
                'token' => $token,
            ], 201);
        } catch (\Exception $e) {
            Log::error('User registration error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            $token = $user->createToken('api-token')->plainTextToken;

            $role = DB::table('model_has_roles')
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->where('model_has_roles.model_id', $user->id)
                ->where('model_has_roles.model_type', User::class)
                ->select('roles.name', 'roles.permissions')
                ->first();

            // Map Spatie permissions to frontend format
            $permissions = $this->mapPermissionsToFrontend($user, $role);

            // Debug log final response
            $responseData = [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $role ? $role->name : 'User',
                    'permissions' => $permissions,
                ],
                'token' => $token
            ];

            Log::info('Login response data', $responseData);

            return response()->json($responseData);
        }

        return response()->json([
            'message' => 'Invalid login credentials'
        ], 401);
    }

    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            return response()->json(['message' => 'Logged out successfully']);
        } catch (\Exception $e) {
            Log::error('User logout error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Logout failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function user(Request $request)
    {
        try {
            $user = $request->user();

            $role = DB::table('model_has_roles')
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->where('model_has_roles.model_id', $user->id)
                ->where('model_has_roles.model_type', User::class)
                ->select('roles.name', 'roles.permissions')
                ->first();

            // Map Spatie permissions to frontend format
            $permissions = $this->mapPermissionsToFrontend($user, $role);

            // Log the response for debugging
            $responseData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $role ? $role->name : 'User',
                'permissions' => $permissions,
            ];

            Log::info('Get user endpoint response', $responseData);

            return response()->json($responseData);
        } catch (\Exception $e) {
            Log::error('Get user error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to get user information: ' . $e->getMessage()
            ], 500);
        }
    }
}
