<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    protected $fillable = [
        'month_year',
        'weeks',
    ];

    protected $casts = [
        'weeks' => 'array',
    ];
}
