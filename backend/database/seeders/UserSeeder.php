<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@church.com'],
            ['name' => 'Admin User', 'password' => Hash::make('password'), 'role' => 'admin']
        );
        User::firstOrCreate(
            ['email' => 'leader@church.com'],
            ['name' => 'Song Leader', 'password' => Hash::make('password'), 'role' => 'leader']
        );
        User::firstOrCreate(
            ['email' => 'member@church.com'],
            ['name' => 'Band Member', 'password' => Hash::make('password'), 'role' => 'member']
        );
    }
}
