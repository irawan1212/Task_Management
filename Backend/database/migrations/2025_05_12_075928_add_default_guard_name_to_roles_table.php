<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Skip this migration as the default guard_name is already set in create_roles_table migration
        if (Schema::hasTable('roles')) {
            Schema::table('roles', function (Blueprint $table) {
                // Check if the guard_name column doesn't already have a default value
                $connection = $table->getConnection();
                $prefix = $connection->getTablePrefix();
                $database = $connection->getDatabaseName();
                $columnInfo = $connection->select("SHOW COLUMNS FROM {$prefix}roles WHERE Field = 'guard_name'")[0];

                if ($columnInfo->Default !== 'web') {
                    $table->string('guard_name')->default('web')->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse as the new roles table handles this
    }
};
