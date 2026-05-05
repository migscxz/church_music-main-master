<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SongVersion extends Model
{
    protected $fillable = [
        'song_id', 
        'song_leader_id', 
        'key', 
        'chords', 
        'tempo', 
        'notes',
        'youtube_link',
        'drive_link',
        'chord_reference'
    ];

    public function song()
    {
        return $this->belongsTo(Song::class);
    }

    public function leader()
    {
        return $this->belongsTo(SongLeader::class, 'song_leader_id');
    }

    public function setlists()
    {
        return $this->belongsToMany(Setlist::class)
                    ->withPivot('order_index')
                    ->withTimestamps();
    }
}
