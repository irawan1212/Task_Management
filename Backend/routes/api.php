<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProjectController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\TaskController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\RoleController;
use App\Http\Controllers\API\ImportExportController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    // Users - basic authenticated access
    Route::apiResource('users', UserController::class);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    // Projects
    Route::apiResource('projects', ProjectController::class);

    // Categories
    Route::apiResource('categories', CategoryController::class);

    // Tasks
    Route::apiResource('tasks', TaskController::class);

    Route::get('/tasks/{task}/audits', [TaskController::class, 'showAudits']);
    Route::post('/tasks/{task}/upload', [TaskController::class, 'uploadAttachment'])
        ->middleware('auth:api');
    // Public route for serving attachments (no auth middleware)
    Route::get('/storage/attachments/{filename}', [TaskController::class, 'serveAttachment']);

    // Roles & Permissions - using safe middleware
    Route::middleware('safe.role:Administrator')->group(function () {
        Route::apiResource('roles', RoleController::class);
        Route::get('/permissions', [RoleController::class, 'permissions']);
    });

    // Import/Export - using safe middleware
    Route::middleware('safe.role:Administrator')->group(function () {
        Route::post('/import/tasks', [ImportExportController::class, 'importTasks']);
        Route::get('/export/tasks', [ImportExportController::class, 'exportTasks']);
    });
});

// Catch-all fallback for undefined API routes
Route::fallback(function () {
    return response()->json([
        'message' => 'API endpoint not found'
    ], 404);
});
