<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AlterTasksTableAddCascade extends Migration
{
    public function up()
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Hapus foreign key yang ada
            $table->dropForeign(['user_id']);
            $table->dropForeign(['assignee_id']);

            // Tambahkan foreign key dengan ON DELETE CASCADE
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            // Untuk assignee_id, gunakan SET NULL (opsional, tergantung kebutuhan)
            $table->foreign('assignee_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Kembalikan ke foreign key tanpa cascade (untuk rollback)
            $table->dropForeign(['user_id']);
            $table->dropForeign(['assignee_id']);

            $table->foreign('user_id')
                ->references('id')
                ->on('users');

            $table->foreign('assignee_id')
                ->references('id')
                ->on('users');
        });
    }
}
