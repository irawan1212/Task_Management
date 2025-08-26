<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddColumnsToProjectsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('projects', function (Blueprint $table) {
            // Add missing columns from the form
            if (!Schema::hasColumn('projects', 'status')) {
                $table->string('status')->default('active');
            }

            if (!Schema::hasColumn('projects', 'start_date')) {
                $table->date('start_date')->nullable();
            }

            if (!Schema::hasColumn('projects', 'end_date')) {
                $table->date('end_date')->nullable();
            }

            if (!Schema::hasColumn('projects', 'budget')) {
                $table->decimal('budget', 15, 2)->nullable();
            }

            if (!Schema::hasColumn('projects', 'manager_id')) {
                $table->unsignedBigInteger('manager_id')->nullable();
                $table->foreign('manager_id')->references('id')->on('users')->onDelete('set null');
            }

            if (!Schema::hasColumn('projects', 'metadata')) {
                $table->json('metadata')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'status')) {
                $table->dropColumn('status');
            }

            if (Schema::hasColumn('projects', 'start_date')) {
                $table->dropColumn('start_date');
            }

            if (Schema::hasColumn('projects', 'end_date')) {
                $table->dropColumn('end_date');
            }

            if (Schema::hasColumn('projects', 'budget')) {
                $table->dropColumn('budget');
            }

            if (Schema::hasColumn('projects', 'manager_id')) {
                $table->dropForeign(['manager_id']);
                $table->dropColumn('manager_id');
            }

            if (Schema::hasColumn('projects', 'metadata')) {
                $table->dropColumn('metadata');
            }
        });
    }
}
