<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 */
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
