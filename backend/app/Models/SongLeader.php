<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SongLeader extends Model
{
    protected $fillable = ['name'];

    public function versions()
    {
        return $this->hasMany(SongVersion::class);
    }
}
