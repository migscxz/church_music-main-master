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
            'user_id' => 'nullable|exists:users,id', // Allow optional user_id for admins
        ]);

        // Only explicitly authenticated users can create songs
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'leader'])) {
            return response()->json(['message' => 'Unauthorized to create songs'], 403);
        }

        // If user is admin and provided a user_id, use it. Otherwise, use own id.
        if ($user->role === 'admin' && isset($validated['user_id'])) {
            // Use the provided user_id
        } else {
            $validated['user_id'] = $user->id;
        }

        $song = Song::create([
            'title' => $validated['title'],
            'original_artist' => $validated['original_artist'] ?? null,
            'original_key' => $validated['original_key'] ?? null,
            'user_id' => $validated['user_id'],
        ]);

        if ($request->has('tags')) {
            $song->tags()->attach($request->input('tags'));
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
        if (!$user || ($user->role !== 'admin' && $song->user_id !== $user->id)) {
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
            'tags.*' => 'exists:tags,id'
        ]);

        $song->update([
            'title' => $validated['title'],
            'original_artist' => $validated['original_artist'] ?? $song->original_artist,
            'original_key' => $validated['original_key'] ?? $song->original_key,
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
