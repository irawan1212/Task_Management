<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::query();

        // Filters
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Sorting
        $sortField = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $projects = $query->with('user')->paginate(10);

        return response()->json($projects);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:active,planning,onhold,completed,cancelled',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'budget' => 'nullable|numeric|min:0',
            'manager_id' => 'nullable|exists:users,id',
            'metadata' => 'nullable|array',
            'metadata.client_name' => 'nullable|string',
            'metadata.priority' => 'nullable|in:low,medium,high,urgent',
            'metadata.notes' => 'nullable|string',
        ]);

        $project = Project::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
            'status' => $validated['status'] ?? 'active',
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'budget' => $validated['budget'],
            'manager_id' => $validated['manager_id'],
            'user_id' => Auth::id(), // Set user_id to authenticated user
            'uuid' => Str::uuid(),
            'settings' => $validated['metadata'] ?? [], // Map metadata to settings
            'is_active' => true,
        ]);

        return response()->json(['data' => $project], 201);
    }
    public function show($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'Invalid project ID'], 400);
        }
        $project = Project::findOrFail($id);
        return response()->json($project);
    }
    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'settings' => 'nullable|json',
        ]);

        $project->update($validated);

        return response()->json($project);
    }

    public function destroy(Project $project)
    {
        $project->delete();
        return response()->json(null, 204);
    }
}