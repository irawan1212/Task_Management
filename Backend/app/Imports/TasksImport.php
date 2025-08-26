<?php

namespace App\Imports;

use App\Models\Task;
use App\Models\Project;
use App\Models\Category;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\Importable;

class TasksImport implements ToModel, WithHeadingRow
{
    use Importable;

    protected $userId;

    public function __construct($userId)
    {
        $this->userId = $userId;
    }

    public function model(array $row)
    {
        // Find project and category by name or create them
        $project = Project::firstOrCreate(
            ['name' => $row['project_name']],
            [
                'description' => 'Imported project',
                'user_id' => $this->userId,
                'is_active' => true
            ]
        );

        $category = Category::firstOrCreate(
            ['name' => $row['category_name']],
            [
                'color' => '#000000',
                'is_active' => true
            ]
        );

        return new Task([
            'title' => $row['title'],
            'description' => $row['description'] ?? null,
            'project_id' => $project->id,
            'category_id' => $category->id,
            'user_id' => $this->userId,
            'due_date' => $row['due_date'] ? \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row['due_date']) : null,
            'is_completed' => $row['is_completed'] ?? false,
            'meta_data' => json_encode(['imported' => true]),
        ]);
    }
}