<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->unsignedInteger('clock_in_accuracy_m')->nullable();
            $table->unsignedInteger('clock_out_distance_m')->nullable();
            $table->unsignedInteger('clock_out_accuracy_m')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['clock_in_accuracy_m', 'clock_out_distance_m', 'clock_out_accuracy_m']);
        });
    }
};
