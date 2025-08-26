<?php

namespace App\Exports;

use App\Models\Task;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\Exportable;

class TasksExport implements FromQuery, WithHeadings, WithMapping
{
    use Exportable;

    protected $userId;
    protected $filters;

    public function __construct($userId, $filters = [])
    {
        $this->userId = $userId;
        $this->filters = $filters;
    }

    public function query()
    {
        $query = Task::query()
            ->with(['project', 'category', 'user'])
            ->where('user_id', $this->userId);

        // Apply any filters
        if (isset($this->filters['project_id'])) {
            $query->where('project_id', $this->filters['project_id']);
        }

        if (isset($this->filters['category_id'])) {
            $query->where('category_id', $this->filters['category_id']);
        }

        if (isset($this->filters['is_completed'])) {
            $query->where('is_completed', $this->filters['is_completed']);
        }

        return $query;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Title',
            'Description',
            'Project Name',
            'Category Name',
            'Due Date',
            'Completed',
            'Created At',
        ];
    }

    public function map($task): array
    {
        return [
            $task->id,
            $task->title,
            $task->description,
            $task->project->name,
            $task->category->name,
            $task->due_date ? $task->due_date->format('Y-m-d') : null,
            $task->is_completed ? 'Yes' : 'No',
            $task->created_at->format('Y-m-d H:i:s'),
        ];
    }
}