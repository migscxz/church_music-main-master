<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SongLeader extends Model
{
    protected $fillable = ['name', 'user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function versions()
    {
        return $this->hasMany(SongVersion::class);
    }
}
