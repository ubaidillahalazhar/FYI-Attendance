<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\OvertimeController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok', 'db' => 'postgresql']));

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});

// Employees
Route::get('/employees', [EmployeeController::class, 'index']);
Route::get('/employees/{employee}/attendance', [AttendanceController::class, 'employeeMonthlyHistory']);

// Employee Clocking (Geofencing)
Route::post('/attendance/clock-in', [AttendanceController::class, 'clockIn']);
Route::post('/attendance/clock-out', [AttendanceController::class, 'clockOut']);

// Overtime Requests
Route::get('/overtime-requests', [OvertimeController::class, 'index']);
Route::post('/overtime-requests', [OvertimeController::class, 'store']);
Route::patch('/overtime-requests/{overtimeRequest}/status', [OvertimeController::class, 'updateStatus']);

// Admin Reports & Export
Route::get('/admin/attendance-report', [AttendanceController::class, 'adminReport']);
Route::get('/admin/attendance-report/export', [AttendanceController::class, 'exportCsv']);
