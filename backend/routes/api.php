<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\OvertimeController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok', 'db' => 'postgresql']));

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
