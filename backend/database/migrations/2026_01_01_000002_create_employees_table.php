<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('employee_no', 30)->unique();
            $table->string('name', 150);
            $table->string('email', 150)->unique();
            $table->string('position', 120);
            $table->string('department', 120);
            $table->foreignId('shift_id')->constrained('shifts')->restrictOnDelete();
            $table->string('avatar_initials', 5)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
