<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Role;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $query = Role::query();

        // Handle search filter
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        }

        // Handle sorting
        $sortBy = $request->sort_by ?? 'name';
        $sortDirection = $request->sort_direction ?? 'asc';

        // Validate sort columns for security
        $allowedSortColumns = ['name', 'created_at', 'updated_at'];
        if (in_array($sortBy, $allowedSortColumns)) {
            $query->orderBy($sortBy, $sortDirection);
        } else {
            $query->orderBy('name', 'asc');
        }

        // Paginate results
        $perPage = $request->per_page ?? 10;
        $roles = $query->paginate($perPage);

        return response()->json($roles);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:3|max:50|unique:roles,name',
            'description' => 'nullable|string|max:255',
            'permissions' => 'required|array'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Make sure at least one permission is selected
        $hasPermission = false;
        foreach ($request->permissions as $permission => $value) {
            if ($value === true) {
                $hasPermission = true;
                break;
            }
        }

        if (!$hasPermission) {
            return response()->json(['errors' => [
                'permissions' => ['At least one permission must be selected']
            ]], 422);
        }

        $role = new Role();
        $role->name = $request->name;
        $role->description = $request->description;
        $role->permissions = $request->permissions;
        $role->guard_name = 'web'; // Set default guard_name
        $role->save();

        return response()->json($role, 201);
    }

    public function show($id)
    {
        $role = Role::findOrFail($id);
        return response()->json($role);
    }

    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|min:3|max:50|unique:roles,name,' . $id,
            'description' => 'nullable|string|max:255',
            'permissions' => 'sometimes|required|array'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check permissions if present
        if ($request->has('permissions')) {
            $hasPermission = false;
            foreach ($request->permissions as $permission => $value) {
                if ($value === true) {
                    $hasPermission = true;
                    break;
                }
            }

            if (!$hasPermission) {
                return response()->json(['errors' => [
                    'permissions' => ['At least one permission must be selected']
                ]], 422);
            }
        }

        if ($request->has('name')) {
            $role->name = $request->name;
        }

        if ($request->has('description')) {
            $role->description = $request->description;
        }

        if ($request->has('permissions')) {
            $role->permissions = $request->permissions;
        }

        $role->save();

        return response()->json($role);
    }

    public function destroy($id)
    {
        $role = Role::findOrFail($id);
        $role->delete();

        return response()->json(null, 204);
    }

    /**
     * Get available permissions for roles
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function permissions()
    {
        // Define the available permissions
        $permissions = [
            'create' => 'Ability to create new items',
            'read' => 'Ability to view items',
            'update' => 'Ability to edit existing items',
            'delete' => 'Ability to delete items'
        ];

        return response()->json($permissions);
    }
}
