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
        Schema::table('song_versions', function (Blueprint $table) {
            $table->integer('capo')->default(0)->after('key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('song_versions', function (Blueprint $table) {
            $table->dropColumn('capo');
        });
    }
};
