<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setlist;
use Illuminate\Http\Request;

class SetlistController extends Controller
{
    public function index()
    {
        return response()->json(Setlist::with(['songVersions.song', 'songVersions.leader'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'nullable|date',
            'song_version_ids' => 'nullable|array',
            'song_version_ids.*' => 'exists:song_versions,id'
        ]);

        $setlist = Setlist::create([
            'title' => $validated['title'],
            'date' => $validated['date'] ?? null,
        ]);

        if (isset($validated['song_version_ids'])) {
            $syncData = [];
            foreach ($validated['song_version_ids'] as $index => $id) {
                $syncData[$id] = ['order_index' => $index];
            }
            $setlist->songVersions()->sync($syncData);
        }

        return response()->json($setlist->load(['songVersions.song', 'songVersions.leader']), 201);
    }

    public function show(string $id)
    {
        $setlist = Setlist::with(['songVersions.song', 'songVersions.leader'])->findOrFail($id);
        return response()->json($setlist);
    }

    public function update(Request $request, string $id)
    {
        $setlist = Setlist::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'nullable|date',
            'song_version_ids' => 'nullable|array',
            'song_version_ids.*' => 'exists:song_versions,id'
        ]);

        $setlist->update([
            'title' => $validated['title'],
            'date' => $validated['date'] ?? $setlist->date,
        ]);

        if (isset($validated['song_version_ids'])) {
            $syncData = [];
            foreach ($validated['song_version_ids'] as $index => $id) {
                $syncData[$id] = ['order_index' => $index];
            }
            $setlist->songVersions()->sync($syncData);
        }

        return response()->json($setlist->load(['songVersions.song', 'songVersions.leader']));
    }

    public function destroy(string $id)
    {
        $setlist = Setlist::findOrFail($id);
        $setlist->delete();
        return response()->json(null, 204);
    }
}
