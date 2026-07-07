<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'leader', 'member', 'pianist') NOT NULL DEFAULT 'member'");
        } elseif ($driver === 'pgsql') {
            DB::unprepared('
                DO $$ 
                DECLARE 
                    constraint_name text;
                BEGIN 
                    SELECT conname INTO constraint_name 
                    FROM pg_constraint 
                    WHERE conrelid = \'users\'::regclass 
                    AND contype = \'c\' 
                    AND pg_get_constraintdef(oid) LIKE \'%role%\';
                    
                    IF constraint_name IS NOT NULL THEN
                        EXECUTE \'ALTER TABLE users DROP CONSTRAINT \' || constraint_name;
                    END IF;
                END $$;
            ');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['admin'::character varying, 'leader'::character varying, 'member'::character varying, 'pianist'::character varying]::text[]))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'leader', 'member') NOT NULL DEFAULT 'member'");
        } elseif ($driver === 'pgsql') {
            DB::unprepared('
                DO $$ 
                DECLARE 
                    constraint_name text;
                BEGIN 
                    SELECT conname INTO constraint_name 
                    FROM pg_constraint 
                    WHERE conrelid = \'users\'::regclass 
                    AND contype = \'c\' 
                    AND pg_get_constraintdef(oid) LIKE \'%role%\';
                    
                    IF constraint_name IS NOT NULL THEN
                        EXECUTE \'ALTER TABLE users DROP CONSTRAINT \' || constraint_name;
                    END IF;
                END $$;
            ');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['admin'::character varying, 'leader'::character varying, 'member'::character varying]::text[]))");
        }
    }
};
