<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\QueryException;

class UserController extends Controller
{
    public function index(Request $request)
    {
        try {
            // Check database connection first
            try {
                DB::connection()->getPdo();
                Log::info('Database connection successful');
            } catch (\Exception $e) {
                Log::error('Database connection failed: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Database connection failed. Please check your configuration.'
                ], 500);
            }

            Log::info('Starting users query with filters: ' . json_encode($request->all()));

            // Start with the base query
            $query = User::query();

            // Apply search filter
            if ($request->has('search') && $request->search) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                        ->orWhere('email', 'like', '%' . $request->search . '%');
                });
            }

            // Handle role filtering safely - only if tables exist
            if ($request->has('role_filter') && $request->role_filter && $this->hasSpatieRoleTables()) {
                Log::info('Filtering by role: ' . $request->role_filter);

                $roleName = $request->role_filter;

                // Custom role filter implementation that doesn't rely on Spatie's methods
                $roleId = DB::table('roles')->where('name', $roleName)->value('id');

                if ($roleId) {
                    $userIdsWithRole = DB::table('model_has_roles')
                        ->where('role_id', $roleId)
                        ->where('model_type', User::class)
                        ->pluck('model_id');

                    $query->whereIn('id', $userIdsWithRole);
                }
            }

            // Apply sorting
            $sortBy = $request->input('sort_by', 'name');
            $sortOrder = $request->input('sort_order', 'asc');
            $allowedSortFields = ['name', 'email', 'created_at'];

            if (in_array($sortBy, $allowedSortFields)) {
                $query->orderBy($sortBy, $sortOrder === 'desc' ? 'desc' : 'asc');
            }

            // Get paginated results 
            $perPage = $request->input('per_page', 10);
            $users = $query->paginate($perPage);
            Log::info('Successfully retrieved ' . count($users->items()) . ' users');

            // Transform the users to include role information
            $transformedUsers = $users->getCollection()->map(function ($user) {
                $userData = $user->toArray();

                // Get role information if tables exist
                if ($this->hasSpatieRoleTables()) {
                    try {
                        $role = DB::table('model_has_roles')
                            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                            ->where('model_has_roles.model_id', $user->id)
                            ->where('model_has_roles.model_type', User::class)
                            ->select('roles.name as role_name', 'roles.id as role_id')
                            ->first();

                        if ($role) {
                            $userData['role'] = $role->role_name;
                            $userData['role_id'] = $role->role_id;
                        } else {
                            $userData['role'] = 'No Role';
                            $userData['role_id'] = null;
                        }
                    } catch (QueryException $e) {
                        Log::warning('Failed to get role for user ' . $user->id . ': ' . $e->getMessage());
                        $userData['role'] = 'Unknown';
                        $userData['role_id'] = null;
                    }
                } else {
                    $userData['role'] = 'No Role System';
                    $userData['role_id'] = null;
                }

                return $userData;
            });

            // Replace the collection in the paginator
            $users->setCollection($transformedUsers);

            return response()->json($users);
        } catch (\Exception $e) {
            // Enhanced error logging
            Log::error('User list error: ' . $e->getMessage());
            Log::error('Exception class: ' . get_class($e));
            Log::error('Stack trace: ' . $e->getTraceAsString());

            // Return more detailed error message for debugging
            return response()->json([
                'message' => 'Failed to fetch users',
                'error' => $e->getMessage(),
                'exception_type' => get_class($e)
            ], 500);
        }
    }

    // Helper function to check if Spatie role tables exist
    private function hasSpatieRoleTables()
    {
        return Schema::hasTable('roles') && Schema::hasTable('model_has_roles');
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
                'role' => 'required|string',
            ]);

            // Create the user
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            // Safely assign role if tables exist
            if ($this->hasSpatieRoleTables()) {
                try {
                    $role = DB::table('roles')->where('name', $validated['role'])->first();
                    if ($role) {
                        DB::table('model_has_roles')->insert([
                            'role_id' => $role->id,
                            'model_type' => User::class,
                            'model_id' => $user->id
                        ]);
                    }
                } catch (QueryException $e) {
                    Log::warning('Failed to assign role: ' . $e->getMessage());
                }
            }

            // Refresh the user and add role information
            $user->refresh();
            $userData = $user->toArray();

            if ($this->hasSpatieRoleTables()) {
                try {
                    $role = DB::table('model_has_roles')
                        ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                        ->where('model_has_roles.model_id', $user->id)
                        ->where('model_has_roles.model_type', User::class)
                        ->select('roles.name as role_name', 'roles.id as role_id')
                        ->first();

                    if ($role) {
                        $userData['role'] = $role->role_name;
                        $userData['role_id'] = $role->role_id;
                    }
                } catch (QueryException $e) {
                    Log::warning('Failed to get role for new user: ' . $e->getMessage());
                }
            }

            return response()->json($userData, 201);
        } catch (\Exception $e) {
            Log::error('Failed to create user: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'message' => 'Failed to create user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $user = User::findOrFail($id);
            $userData = $user->toArray();

            // Add role information
            if ($this->hasSpatieRoleTables()) {
                try {
                    $role = DB::table('model_has_roles')
                        ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                        ->where('model_has_roles.model_id', $user->id)
                        ->where('model_has_roles.model_type', User::class)
                        ->select('roles.name as role_name', 'roles.id as role_id')
                        ->first();

                    if ($role) {
                        $userData['role'] = $role->role_name;
                        $userData['role_id'] = $role->role_id;
                    } else {
                        $userData['role'] = 'No Role';
                        $userData['role_id'] = null;
                    }
                } catch (QueryException $e) {
                    Log::warning('Failed to get role for user ' . $user->id . ': ' . $e->getMessage());
                    $userData['role'] = 'Unknown';
                    $userData['role_id'] = null;
                }
            }

            return response()->json($userData);
        } catch (\Exception $e) {
            Log::error('Failed to fetch user: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to fetch user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $id,
                'password' => 'nullable|string|min:8|confirmed',
                'role' => 'sometimes|required|string',
            ]);

            $updateData = [];
            if (isset($validated['name'])) {
                $updateData['name'] = $validated['name'];
            }

            if (isset($validated['email'])) {
                $updateData['email'] = $validated['email'];
            }

            if (!empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }

            $user->update($updateData);

            // Update role if provided and tables exist
            if (isset($validated['role']) && $this->hasSpatieRoleTables()) {
                try {
                    // Remove existing roles first
                    DB::table('model_has_roles')
                        ->where('model_id', $user->id)
                        ->where('model_type', User::class)
                        ->delete();

                    // Assign new role
                    $role = DB::table('roles')->where('name', $validated['role'])->first();
                    if ($role) {
                        DB::table('model_has_roles')->insert([
                            'role_id' => $role->id,
                            'model_type' => User::class,
                            'model_id' => $user->id
                        ]);
                    }
                } catch (QueryException $e) {
                    Log::warning('Failed to update role: ' . $e->getMessage());
                }
            }

            // Get updated user with role information
            $user->refresh();
            $userData = $user->toArray();

            if ($this->hasSpatieRoleTables()) {
                try {
                    $role = DB::table('model_has_roles')
                        ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                        ->where('model_has_roles.model_id', $user->id)
                        ->where('model_has_roles.model_type', User::class)
                        ->select('roles.name as role_name', 'roles.id as role_id')
                        ->first();

                    if ($role) {
                        $userData['role'] = $role->role_name;
                        $userData['role_id'] = $role->role_id;
                    } else {
                        $userData['role'] = 'No Role';
                        $userData['role_id'] = null;
                    }
                } catch (QueryException $e) {
                    Log::warning('Failed to get role for updated user: ' . $e->getMessage());
                    $userData['role'] = 'Unknown';
                    $userData['role_id'] = null;
                }
            }

            return response()->json($userData);
        } catch (\Exception $e) {
            Log::error('Failed to update user: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'message' => 'Failed to update user: ' . $e->getMessage()
            ], 500);
        }
    }
    public function getCurrentUser(Request $request)
    {
        $user = $request->user();
        $user->load('roles');
        return response()->json($user);
    }

    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);
            $isAdmin = false;

            // Check if user is admin
            if ($this->hasSpatieRoleTables()) {
                try {
                    $isAdmin = DB::table('model_has_roles')
                        ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                        ->where('model_has_roles.model_id', $user->id)
                        ->where('model_has_roles.model_type', User::class)
                        ->where('roles.name', 'Administrator')
                        ->exists();

                    if ($isAdmin) {
                        $adminCount = DB::table('model_has_roles')
                            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                            ->where('roles.name', 'Administrator')
                            ->where('model_has_roles.model_type', User::class)
                            ->count();

                        if ($adminCount <= 1) {
                            return response()->json([
                                'message' => 'Cannot delete the last administrator'
                            ], 422);
                        }
                    }
                } catch (QueryException $e) {
                    Log::warning('Failed to check admin status: ' . $e->getMessage());
                }
            }

            // Delete related tasks
            $deletedTasks = Task::where('user_id', $id)
                ->orWhere('assignee_id', $id)
                ->delete();
            Log::info("Deleted $deletedTasks tasks for user $id");

            // Delete user roles if tables exist
            if ($this->hasSpatieRoleTables()) {
                try {
                    DB::table('model_has_roles')
                        ->where('model_id', $user->id)
                        ->where('model_type', User::class)
                        ->delete();
                } catch (QueryException $e) {
                    Log::warning('Failed to delete user roles: ' . $e->getMessage());
                }
            }

            // Delete user
            $user->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Failed to delete user: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete user: ' . $e->getMessage()
            ], 500);
        }
    }
}
