<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;
use OwenIt\Auditing\Models\Audit;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Task::query();

            if ($request->has('user_id') || $request->has('assignee_id')) {
                $query->where(function ($q) use ($request) {
                    if ($request->has('user_id')) {
                        $q->where('user_id', $request->user_id);
                    }
                    if ($request->has('assignee_id')) {
                        $q->orWhere('assignee_id', $request->assignee_id);
                    }
                });
            }

            if ($request->has('search') && $request->search) {
                $query->where(function ($q) use ($request) {
                    $q->where('title', 'like', '%' . $request->search . '%')
                        ->orWhere('description', 'like', '%' . $request->search . '%');
                });
            }

            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'asc');
            $allowedSortFields = ['title', 'created_at', 'due_date'];

            if (in_array($sortBy, $allowedSortFields)) {
                $query->orderBy($sortBy, $sortOrder === 'desc' ? 'desc' : 'asc');
            }

            $perPage = $request->input('per_page', 50);
            $tasks = $query->paginate($perPage);

            Log::info('Successfully retrieved ' . count($tasks) . ' tasks');

            return response()->json($tasks);
        } catch (\Exception $e) {
            Log::error('Failed to fetch tasks: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch tasks: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        Log::info('Task creation request:', $request->all());

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'required|exists:projects,id',
            'category_id' => 'required|exists:categories,id',
            'user_id' => 'required|exists:users,id',
            'assignee_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'is_completed' => 'boolean',
            'status' => 'nullable|string|in:pending,in_progress,completed,cancelled',
            'meta_data' => 'nullable|json',
        ]);

        if (!isset($validated['assignee_id'])) {
            $validated['assignee_id'] = $validated['user_id'];
        }

        Log::info('Authenticated user:', ['user' => $request->user() ? $request->user()->toArray() : null]);
        Log::info('Validated data:', $validated);

        $task = Task::create($validated);
        $task->load(['project', 'category', 'user', 'assignee']);

        return response()->json($task, 201);
    }

    public function show(Task $task)
    {
        $task->load('project', 'category', 'user', 'assignee');
        return response()->json($task);
    }

    public function update(Request $request, Task $task)
    {
        Log::info('Task update - Original task:', [
            'id' => $task->id,
            'title' => $task->title,
            'project_id' => $task->project_id,
            'category_id' => $task->category_id,
            'user_id' => $task->user_id,
            'assignee_id' => $task->assignee_id,
            'status' => $task->status,
            'is_completed' => $task->is_completed,
        ]);

        Log::info('Task update - Request data:', $request->all());

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'sometimes|exists:projects,id',
            'category_id' => 'sometimes|exists:categories,id',
            'user_id' => 'sometimes|exists:users,id',
            'assignee_id' => 'sometimes|exists:users,id',
            'due_date' => 'nullable|date',
            'is_completed' => 'sometimes|boolean',
            'status' => 'sometimes|string|in:pending,in_progress,completed,cancelled',
            'meta_data' => 'nullable|json',
        ]);

        if (isset($validated['user_id']) && !isset($validated['assignee_id'])) {
            $validated['assignee_id'] = $validated['user_id'];
        }

        if (isset($validated['status'])) {
            $validated['is_completed'] = $validated['status'] === 'completed';
        } elseif (isset($validated['is_completed'])) {
            $validated['status'] = $validated['is_completed'] ? 'completed' : 'pending';
        }

        Log::info('Task update - Validated data:', $validated);

        $task->update($validated);

        $task = $task->fresh();

        Log::info('Task update - Updated task:', [
            'id' => $task->id,
            'title' => $task->title,
            'project_id' => $task->project_id,
            'category_id' => $task->category_id,
            'user_id' => $task->user_id,
            'assignee_id' => $task->assignee_id,
            'status' => $task->status,
            'is_completed' => $task->is_completed,
        ]);

        $task->load(['project', 'category', 'user', 'assignee']);

        return response()->json($task);
    }

    public function destroy(Task $task)
    {
        if ($task->attachment && Storage::disk('public')->exists($task->attachment)) {
            Storage::disk('public')->delete($task->attachment);
        }
        $task->delete();
        return response()->json(null, 204);
    }

    public function uploadAttachment(Request $request, Task $task)
    {
        $user = $request->user();
        if (!$user) {
            Log::warning('Unauthenticated attachment upload attempt', ['task_id' => $task->id]);
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'attachment' => 'required|file|mimes:pdf|min:1|max:500',
        ], [
            'attachment.required' => 'No file was provided.',
            'attachment.mimes' => 'Only PDF files are allowed.',
            'attachment.min' => 'File size must be at least 100KB.',
            'attachment.max' => 'File size must not exceed 500KB.',
        ]);

        try {
            if ($request->hasFile('attachment') && $request->file('attachment')->isValid()) {
                $file = $request->file('attachment');
                // Store in storage/app/public/attachments/ explicitly
                $path = $file->store('attachments', 'public');

                if (!Storage::disk('public')->exists($path)) {
                    Log::error('Failed to store attachment', ['task_id' => $task->id, 'path' => $path]);
                    return response()->json(['message' => 'Failed to store attachment'], 500);
                }

                if ($task->attachment && Storage::disk('public')->exists($task->attachment)) {
                    Storage::disk('public')->delete($task->attachment);
                }

                $task->attachment = $path; // e.g., attachments/llavVSXb2a1ghFSYQfaiwkYc0nPfB6u5ea7Ucs.pdf
                $task->attachment_name = $file->getClientOriginalName();
                $task->save();

                Log::info('Attachment uploaded successfully', [
                    'task_id' => $task->id,
                    'path' => $path,
                    'filename' => $task->attachment_name,
                    'user_id' => $user->id,
                ]);

                $task->load(['project', 'category', 'user', 'assignee']);
                return response()->json($task);
            }

            Log::error('No valid file provided for upload', ['task_id' => $task->id]);
            return response()->json(['message' => 'No valid file provided'], 400);
        } catch (\Exception $e) {
            Log::error('Failed to upload attachment: ' . $e->getMessage(), [
                'task_id' => $task->id,
                'user_id' => $user->id,
            ]);
            return response()->json(['message' => 'Failed to upload attachment: ' . $e->getMessage()], 500);
        }
    }
    public function serveAttachment($filename)
    {
        $path = storage_path('app/public/' . $filename); // e.g., storage/app/public/attachments/llavVSXb2a1ghFSYQfaiwkYc0nPfB6u5ea7Ucs.pdf

        Log::info('Attempting to serve attachment', [
            'filename' => $filename,
            'path' => $path,
            'file_exists' => file_exists($path),
            'is_readable' => is_readable($path),
        ]);

        if (!file_exists($path)) {
            Log::error('Attachment not found', ['filename' => $filename, 'path' => $path]);
            return response()->json(['message' => 'File not found'], 404);
        }

        if (!is_readable($path)) {
            Log::error('Attachment not readable', ['filename' => $filename, 'path' => $path]);
            return response()->json(['message' => 'File not readable'], 403);
        }

        return response()->file($path, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . basename($path) . '"',
        ]);
    }}
