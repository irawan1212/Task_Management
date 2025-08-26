<?php

namespace App\Http\Controllers\API;

use Illuminate\Foundation\Bus\DispatchesJobs;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Jobs\ImportTasks;
use App\Jobs\ExportTasks;
use App\Exports\TasksExport;
use App\Imports\TasksImport;
use Maatwebsite\Excel\Facades\Excel;

class ImportExportController extends Controller
{
    use DispatchesJobs;

    public function importTasks(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv',
        ]);

        $file = $request->file('file');
        $userId = $request->user()->id;

        // Queue the import job
        ImportTasks::dispatch($file->getRealPath(), $userId);

        return response()->json(['message' => 'Import started in background']);
    }

    public function exportTasks(Request $request)
    {
        $userId = $request->user()->id;
        $filters = $request->all();

        // Queue the export job
        $this->dispatch(new ExportTasks($userId, $filters));

        return response()->json(['message' => 'Export started in background']);
    }
}