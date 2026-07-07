<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Song;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SongController extends Controller
{
    public function index()
    {
        return response()->json(Song::with(['versions.leader', 'tags'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
                Rule::unique('songs')->where(function ($query) use ($request) {
                    return $query->where('original_artist', $request->original_artist);
                })
            ],
            'original_artist' => 'nullable|string|max:255',
            'original_key' => 'nullable|string|max:10',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
            'song_leader_id' => 'nullable|exists:song_leaders,id',
            'original_capo' => 'nullable|integer|min:0|max:11',
        ]);

        // Only explicitly authenticated users can create songs
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'leader', 'pianist'])) {
            return response()->json(['message' => 'Unauthorized to create songs'], 403);
        }

        $song = Song::create([
            'title' => $validated['title'],
            'original_artist' => $validated['original_artist'] ?? null,
            'original_key' => $validated['original_key'] ?? null,
            'original_capo' => $validated['original_capo'] ?? 0,
            'user_id' => $user->id,
        ]);

        if ($request->has('tags')) {
            $song->tags()->attach($request->input('tags'));
        }

        $targetLeaderId = null;
        if (in_array($user->role, ['admin', 'pianist']) && !empty($validated['song_leader_id'])) {
            $targetLeaderId = $validated['song_leader_id'];
        } else if (!in_array($user->role, ['admin', 'pianist'])) {
            $leader = \App\Models\SongLeader::where('name', $user->name)->first();
            if ($leader) {
                $targetLeaderId = $leader->id;
            }
        }

        if ($targetLeaderId) {
            \App\Models\SongVersion::create([
                'song_id' => $song->id,
                'song_leader_id' => $targetLeaderId,
                'key' => $validated['original_key'] ?? 'C',
            ]);
        }

        return response()->json($song->load(['versions.leader', 'tags']), 201);
    }

    public function show(string $id)
    {
        $song = Song::with(['versions.leader', 'tags'])->findOrFail($id);
        return response()->json($song);
    }

    public function update(Request $request, string $id)
    {
        $song = Song::findOrFail($id);
        $user = $request->user();

        // Enforce update ownership
        if (!$user || (!in_array($user->role, ['admin', 'pianist']) && $song->user_id !== $user->id)) {
            return response()->json(['message' => 'Unauthorized to edit this song'], 403);
        }

        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
                Rule::unique('songs')->where(function ($query) use ($request) {
                    return $query->where('original_artist', $request->original_artist);
                })->ignore($song->id)
            ],
            'original_artist' => 'nullable|string|max:255',
            'original_key' => 'nullable|string|max:10',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
            'original_capo' => 'nullable|integer|min:0|max:11',
        ]);

        $song->update([
            'title' => $validated['title'],
            'original_artist' => $validated['original_artist'] ?? $song->original_artist,
            'original_key' => $validated['original_key'] ?? $song->original_key,
            'original_capo' => $validated['original_capo'] ?? $song->original_capo,
        ]);

        if ($request->has('tags')) {
            $song->tags()->sync($request->input('tags'));
        }

        return response()->json($song->load(['versions.leader', 'tags']));
    }

    public function destroy(Request $request, string $id)
    {
        $song = Song::findOrFail($id);
        $user = $request->user();

        // Enforce delete ownership
        if (!$user || ($user->role !== 'admin' && $song->user_id !== $user->id)) {
            return response()->json(['message' => 'Unauthorized to delete this song'], 403);
        }

        $song->delete();
        return response()->json(null, 204);
    }
}
