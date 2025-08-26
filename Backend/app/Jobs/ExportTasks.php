<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Exports\TasksExport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Str;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Notification;
use App\Notifications\ExportCompleted;

class ExportTasks implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $userId;
    protected $filters;

    public function __construct($userId, $filters = [])
    {
        $this->userId = $userId;
        $this->filters = $filters;
    }

    public function handle()
    {
        // Generate a unique filename
        $filename = 'tasks_export_' . $this->userId . '_' . Str::random(10) . '.xlsx';
        $filePath = 'exports/' . $filename;

        // Export to storage
        Excel::store(
            new TasksExport($this->userId, $this->filters),
            $filePath
        );

        // Get user for notification
        $user = User::find($this->userId);

        // Send notification to user
        if ($user) {
            $downloadUrl = Storage::url($filePath);
            $user->notify(new ExportCompleted($downloadUrl));
        }
    }
}