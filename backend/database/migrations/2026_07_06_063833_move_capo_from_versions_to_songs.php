<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('songs', function (Blueprint $table) {
            $table->integer('original_capo')->default(0)->after('original_key');
        });

        Schema::table('song_versions', function (Blueprint $table) {
            $table->dropColumn('capo');
        });
    }

    public function down(): void
    {
        Schema::table('songs', function (Blueprint $table) {
            $table->dropColumn('original_capo');
        });

        Schema::table('song_versions', function (Blueprint $table) {
            $table->integer('capo')->default(0)->after('chord_reference');
        });
    }
};
