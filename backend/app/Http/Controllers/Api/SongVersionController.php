<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SongVersion;
use Illuminate\Http\Request;

class SongVersionController extends Controller
{
    public function index()
    {
        return response()->json(SongVersion::with(['song.tags', 'leader'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'song_id' => 'required|exists:songs,id',
            'song_leader_id' => 'required|exists:song_leaders,id',
            'key' => 'nullable|string|max:10',
            'chords' => 'nullable|string',
            'tempo' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'youtube_link' => 'nullable|url|max:255',
            'drive_link' => 'nullable|url|max:255',
            'chord_reference' => 'nullable|url|max:255',
        ]);

        $version = SongVersion::create($validated);
        return response()->json($version->load(['song', 'leader']), 201);
    }

    public function show(string $id)
    {
        $version = SongVersion::with(['song', 'leader'])->findOrFail($id);
        return response()->json($version);
    }

    public function update(Request $request, string $id)
    {
        $version = SongVersion::findOrFail($id);

        $validated = $request->validate([
            'song_id' => 'sometimes|exists:songs,id',
            'song_leader_id' => 'sometimes|exists:song_leaders,id',
            'key' => 'nullable|string|max:10',
            'chords' => 'nullable|string',
            'tempo' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'youtube_link' => 'nullable|url|max:255',
            'drive_link' => 'nullable|url|max:255',
            'chord_reference' => 'nullable|url|max:255',
        ]);

        $version->update($validated);
        return response()->json($version->load(['song', 'leader']));
    }

    public function destroy(string $id)
    {
        $version = SongVersion::findOrFail($id);
        $version->delete();
        return response()->json(null, 204);
    }
}
