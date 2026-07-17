<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SongLeader;
use Illuminate\Http\Request;

class SongLeaderController extends Controller
{
    public function index()
    {
        return response()->json(SongLeader::with('versions')->get());
    }

    public function store(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Only admins can create song leaders.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $leader = SongLeader::create($validated);
        return response()->json($leader, 201);
    }

    public function show(string $id)
    {
        $leader = SongLeader::with('versions')->findOrFail($id);
        return response()->json($leader);
    }

    public function update(Request $request, string $id)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Only admins can edit song leaders.'], 403);
        }

        $leader = SongLeader::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $leader->update($validated);
        return response()->json($leader);
    }

    public function destroy(string $id)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Only admins can delete song leaders.'], 403);
        }

        $leader = SongLeader::findOrFail($id);
        $leader->delete();
        return response()->json(null, 204);
    }
}
