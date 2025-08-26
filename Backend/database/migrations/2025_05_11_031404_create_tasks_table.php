<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid');
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('project_id')->constrained();
            $table->foreignId('category_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->dateTime('due_date')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->json('meta_data')->nullable();

            $table->string('attachment')->nullable();
            $table->string('attachment_name')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tasks');
    }
};
