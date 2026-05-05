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
        Schema::table('songs', function (Blueprint $table) {
            $table->string('original_key')->nullable()->after('original_artist');
        });

        Schema::table('song_versions', function (Blueprint $table) {
            $table->string('youtube_link')->nullable()->after('notes');
            $table->string('drive_link')->nullable()->after('youtube_link');
            $table->string('chord_reference')->nullable()->after('drive_link');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('songs', function (Blueprint $table) {
            $table->dropColumn('original_key');
        });

        Schema::table('song_versions', function (Blueprint $table) {
            $table->dropColumn(['youtube_link', 'drive_link', 'chord_reference']);
        });
    }
};
