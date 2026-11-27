<?php

namespace App\Services;

use Carbon\Carbon;

class AttendanceCalculatorService
{
    public function calculate(
        string $shiftIn,
        string $shiftOut,
        ?string $actualIn,
        ?string $actualOut,
        int $scheduleMinutes = 540,
        int $overtimeMinutes = 0
    ): array {
        $baseDate = '2026-01-01 ';
        $sIn = Carbon::parse($baseDate . $shiftIn);
        $sOut = Carbon::parse($baseDate . $shiftOut);
        $aIn = $actualIn ? Carbon::parse($baseDate . $actualIn) : null;
        $aOut = $actualOut ? Carbon::parse($baseDate . $actualOut) : null;

        $minuteIn = $aIn ? (int) $sIn->diffInMinutes($aIn, false) : 0;
        $minuteOut = $aOut ? (int) $sOut->diffInMinutes($aOut, false) : 0;
        $actualWorkingMinute = ($aIn && $aOut) ? max(0, (int) $aIn->diffInMinutes($aOut, false)) : 0;

        $remark = 'Present';
        if (!$aIn) {
            $remark = 'Absent';
        } elseif ($minuteIn > 0 && $overtimeMinutes > 0) {
            $remark = 'Late & Overtime';
        } elseif ($minuteIn > 0) {
            $remark = 'Late';
        } elseif ($overtimeMinutes > 0) {
            $remark = 'Overtime';
        } elseif ($aOut && $minuteOut < 0) {
            $remark = 'Early Out';
        } elseif (!$aOut) {
            $remark = 'Working';
        }

        return [
            'minute_in' => $minuteIn,
            'minute_out' => $minuteOut,
            'actual_working_minute' => $actualWorkingMinute,
            'shift_schedule_minute' => $scheduleMinutes,
            'remark' => $remark,
        ];
    }
}
