<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SongController;
use App\Http\Controllers\Api\SongLeaderController;
use App\Http\Controllers\Api\SongVersionController;
use App\Http\Controllers\Api\SetlistController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ScheduleController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
        Route::apiResource('users', \App\Http\Controllers\Api\UserController::class);
    Route::apiResource('songs', SongController::class)->except(['index', 'show']);
    Route::apiResource('song-leaders', SongLeaderController::class)->except(['index', 'show']);
    Route::apiResource('song-versions', SongVersionController::class)->except(['index', 'show']);
    Route::apiResource('setlists', SetlistController::class);
    Route::apiResource('tags', TagController::class)->except(['index', 'show']);
    Route::apiResource('schedules', ScheduleController::class)->except(['index', 'show']);
});

// Public read access
Route::get('songs', [SongController::class, 'index']);
Route::get('songs/{song}', [SongController::class, 'show']);
Route::get('song-leaders', [SongLeaderController::class, 'index']);
Route::get('song-leaders/{song_leader}', [SongLeaderController::class, 'show']);
Route::get('song-versions', [SongVersionController::class, 'index']);
Route::get('song-versions/{song_version}', [SongVersionController::class, 'show']);
Route::get('tags', [TagController::class, 'index']);
Route::get('tags/{tag}', [TagController::class, 'show']);
Route::get('schedules', [ScheduleController::class, 'index']);
