<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index()
    {
        return Schedule::orderBy('month_year', 'desc')->get();
    }

    public function store(Request $request)
    {
        if (!in_array($request->user()->role, ['admin', 'pianist'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'month_year' => 'required|string|unique:schedules,month_year',
            'weeks' => 'nullable|array',
        ]);

        $schedule = Schedule::create($validated);
        return response()->json($schedule, 201);
    }

    public function update(Request $request, Schedule $schedule)
    {
        if (!in_array($request->user()->role, ['admin', 'pianist'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'month_year' => 'sometimes|required|string|unique:schedules,month_year,' . $schedule->id,
            'weeks' => 'nullable|array',
        ]);

        $schedule->update($validated);
        return response()->json($schedule);
    }

    public function destroy(Request $request, Schedule $schedule)
    {
        if (!in_array($request->user()->role, ['admin', 'pianist'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $schedule->delete();
        return response()->json(null, 204);
    }
}
