<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('shift_id')->constrained('shifts')->restrictOnDelete();
            $table->date('attendance_date');
            $table->time('actual_in')->nullable();
            $table->time('actual_out')->nullable();
            $table->double('clock_in_lat')->nullable();
            $table->double('clock_in_lng')->nullable();
            $table->double('clock_out_lat')->nullable();
            $table->double('clock_out_lng')->nullable();
            $table->integer('distance_in_meters')->nullable();
            $table->integer('minute_in')->default(0);
            $table->integer('minute_out')->default(0);
            $table->integer('actual_working_minute')->default(0);
            $table->integer('shift_schedule_minute')->default(540);
            $table->string('remark', 50)->default('Present');
            $table->text('overtime_reason')->nullable();
            $table->time('overtime_start')->nullable();
            $table->time('overtime_end')->nullable();
            $table->integer('overtime_minutes')->default(0);
            $table->decimal('overtime_hours', 5, 2)->default(0.00);
            $table->timestamps();

            $table->unique(['employee_id', 'attendance_date']);
            $table->index('attendance_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
