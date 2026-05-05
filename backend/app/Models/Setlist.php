<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setlist extends Model
{
    protected $fillable = ['title', 'date'];

    public function songVersions()
    {
        return $this->belongsToMany(SongVersion::class)
                    ->withPivot('order_index')
                    ->withTimestamps()
                    ->orderBy('order_index');
    }
}
