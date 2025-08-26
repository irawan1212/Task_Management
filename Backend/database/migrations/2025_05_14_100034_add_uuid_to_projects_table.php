<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use App\Models\Project;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if the uuid column already exists
        if (!Schema::hasColumn('projects', 'uuid')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->uuid('uuid')->after('id');
            });

            // Generate UUIDs for existing projects
            $projects = Project::all();
            foreach ($projects as $project) {
                $project->uuid = Str::uuid()->toString();
                $project->save();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('projects', 'uuid')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropColumn('uuid');
            });
        }
    }
};
